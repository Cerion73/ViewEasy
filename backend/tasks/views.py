from rest_framework import viewsets, permissions, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from django.core.mail import send_mail
from django.contrib.auth import get_user_model
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import Task, Team, TeamMembership, Invitation, DailyAchievement
from .serializers import TaskSerializer, TeamSerializer, TeamMembershipSerializer, InvitationSerializer, DailyAchievementSerializer

User = get_user_model()

class DailyAchievementViewSet(viewsets.ModelViewSet):
    serializer_class = DailyAchievementSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Users can only see their own achievements
        return DailyAchievement.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class IsOwnerOrTeamMember(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        # Allow if user is task owner
        if getattr(obj, 'user', None) == request.user:
            return True
        # Allow if task is in a team the user is part of
        if getattr(obj, 'team', None) and TeamMembership.objects.filter(team=obj.team, user=request.user).exists():
            # If viewer, they can only do SAFE_METHODS
            if request.method in permissions.SAFE_METHODS:
                return True
            # Editors and managers can update
            membership = TeamMembership.objects.get(team=obj.team, user=request.user)
            if membership.role in ['editor', 'manager']:
                return True
        return False

class TeamViewSet(viewsets.ModelViewSet):
    serializer_class = TeamSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Team.objects.filter(Q(owner=self.request.user) | Q(memberships__user=self.request.user)).distinct()

    def perform_create(self, serializer):
        team = serializer.save(owner=self.request.user)
        TeamMembership.objects.create(team=team, user=self.request.user, role='manager')

class InvitationViewSet(viewsets.ModelViewSet):
    serializer_class = InvitationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Users can see invitations sent to them or teams they manage
        return Invitation.objects.filter(Q(email=self.request.user.email) | Q(team__owner=self.request.user))

    def perform_create(self, serializer):
        invitation = serializer.save(invited_by=self.request.user)
        email = invitation.email
        
        # Check if user exists
        user_exists = User.objects.filter(Q(email=email) | Q(username=email)).first()
        
        if user_exists:
            # Send in-app WebSocket notification
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                f"user_{user_exists.id}",
                {
                    "type": "send_notification",
                    "message": f"You have been invited to join team {invitation.team.name}!"
                }
            )
        else:
            # Send email
            send_mail(
                'You are invited to ViewEasy!',
                f'You have been invited to join the team {invitation.team.name} on ViewEasy. Please register to accept.',
                'noreply@vieweasy.com',
                [email],
                fail_silently=True,
            )

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        invitation = self.get_object()
        if invitation.email == request.user.email or User.objects.filter(username=invitation.email, id=request.user.id).exists():
            invitation.status = 'accepted'
            invitation.save()
            TeamMembership.objects.get_or_create(team=invitation.team, user=request.user, defaults={'role': 'viewer'})
            return Response({'status': 'accepted'})
        return Response({'error': 'Not authorized to accept this invite'}, status=status.HTTP_403_FORBIDDEN)

class TaskViewSet(viewsets.ModelViewSet):
    """
    A viewset for viewing and editing user tasks.
    It provides standard CRUD operations (list, create, retrieve, update, destroy).
    """
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrTeamMember]

    def get_queryset(self):
        """
        Overrides the default queryset to implement strict object-level permissions.
        Ensures that a user can only view or interact with their own tasks, or tasks in their teams.
        """
        user = self.request.user
        queryset = Task.objects.filter(
            Q(user=user) | Q(team__memberships__user=user)
        ).distinct()

        # Handle ?deleted=true to fetch only soft-deleted items (for Trash Bin)
        if self.request.query_params.get('deleted') == 'true':
            from django.utils import timezone
            from datetime import timedelta
            thirty_days_ago = timezone.now() - timedelta(days=30)
            
            queryset = Task.all_objects.filter(
                Q(user=user) | Q(team__memberships__user=user),
                is_deleted=True,
                is_permanently_deleted=False,
                deleted_at__gte=thirty_days_ago
            ).distinct()

        # Filter by team if specified
        team_id = self.request.query_params.get('team')
        if team_id:
            queryset = queryset.filter(team__id=team_id)

        # Filter for personal-only tasks (no team)
        if self.request.query_params.get('personal') == 'true':
            queryset = queryset.filter(team__isnull=True)

        return queryset

    def perform_create(self, serializer):
        """
        Overrides the default creation behavior to automatically associate
        the newly created task with the currently authenticated user.
        """
        user = self.request.user
        serializer.save(user=user)
        user.record_activity()
        user.award_points(10) # 10 points for creating a task

    def perform_update(self, serializer):
        user = self.request.user
        instance = self.get_object()
        old_status = instance.status
        new_status = serializer.validated_data.get('status', old_status)
        
        serializer.save()
        
        if old_status != new_status:
            user.record_activity()
            user.award_points(5) # 5 points for moving a task

    @action(detail=True, methods=['post'])
    def restore(self, request, pk=None):
        """Restores a soft-deleted task."""
        try:
            task = Task.all_objects.get(pk=pk, user=request.user)
            if task.is_permanently_deleted:
                return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
            task.is_deleted = False
            task.deleted_at = None
            task.save()
            return Response({"status": "task restored"}, status=status.HTTP_200_OK)
        except Task.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['post'])
    def delete_permanently(self, request, pk=None):
        """Permanently deletes a task (hides it forever from user)."""
        try:
            task = Task.all_objects.get(pk=pk, user=request.user)
            task.is_permanently_deleted = True
            task.save()
            return Response({"status": "task permanently deleted"}, status=status.HTTP_200_OK)
        except Task.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['post'])
    def empty_trash(self, request):
        """Permanently deletes all tasks in the user's trash bin."""
        tasks = Task.all_objects.filter(user=request.user, is_deleted=True, is_permanently_deleted=False)
        tasks.update(is_permanently_deleted=True)
        return Response({"status": "trash emptied"}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'])
    def history(self, request, pk=None):
        """
        Custom endpoint to fetch the historical audit trail of a specific task.
        Extracts records created by simple_history and formats them for the frontend timeline.
        """
        task = self.get_object()
        history_records = task.history.all()
        data = []
        for record in history_records:
            data.append({
                'history_id': record.history_id,
                'history_date': record.history_date,
                'history_type': record.history_type,
                'history_user': record.history_user.username if record.history_user else None,
                'title': record.title,
                'status': record.status,
                'description': record.description
            })
        return Response(data)
