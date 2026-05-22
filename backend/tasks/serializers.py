import re
from datetime import timedelta
from django.utils import timezone
from rest_framework import serializers
from .models import Task, Team, TeamMembership, Invitation, DailyAchievement
from django.contrib.auth import get_user_model

User = get_user_model()

class TeamMembershipSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = TeamMembership
        fields = ('id', 'user', 'username', 'email', 'role', 'joined_at')
        read_only_fields = ('id', 'joined_at')

class TeamSerializer(serializers.ModelSerializer):
    memberships = TeamMembershipSerializer(many=True, read_only=True)
    owner_name = serializers.CharField(source='owner.username', read_only=True)

    class Meta:
        model = Team
        fields = ('id', 'name', 'owner', 'owner_name', 'created_at', 'memberships')
        read_only_fields = ('id', 'owner', 'created_at')

class InvitationSerializer(serializers.ModelSerializer):
    team_name = serializers.CharField(source='team.name', read_only=True)
    invited_by_name = serializers.CharField(source='invited_by.username', read_only=True)

    class Meta:
        model = Invitation
        fields = ('id', 'team', 'team_name', 'email', 'status', 'invited_by', 'invited_by_name', 'created_at')
        read_only_fields = ('id', 'status', 'invited_by', 'created_at')

class DailyAchievementSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = DailyAchievement
        fields = ('id', 'user', 'username', 'date', 'content', 'created_at', 'updated_at')
        read_only_fields = ('id', 'user', 'created_at', 'updated_at')

class HumanReadableDurationField(serializers.DurationField):
    """
    Parses human-readable duration strings (e.g., '1 month 2 days') into timedelta.
    Outputs timedelta objects back into human-readable strings.
    """
    def to_internal_value(self, value):
        if not value:
            return None
            
        pattern = r'(?P<value>\d+)\s*(?P<unit>second|minute|hour|day|week|month)s?'
        matches = re.finditer(pattern, value.lower())
        
        total_seconds = 0
        found = False
        for match in matches:
            found = True
            val = int(match.group('value'))
            unit = match.group('unit')
            
            if unit == 'second': total_seconds += val
            elif unit == 'minute': total_seconds += val * 60
            elif unit == 'hour': total_seconds += val * 3600
            elif unit == 'day': total_seconds += val * 86400
            elif unit == 'week': total_seconds += val * 604800
            elif unit == 'month': total_seconds += val * 2592000 # Approx 30 days
                
        if not found:
            # Fallback to Django's default behavior
            return super().to_internal_value(value)
            
        return timedelta(seconds=total_seconds)

    def to_representation(self, value):
        if not value:
            return ""
        total_seconds = int(value.total_seconds())
        months, total_seconds = divmod(total_seconds, 2592000)
        weeks, total_seconds = divmod(total_seconds, 604800)
        days, total_seconds = divmod(total_seconds, 86400)
        hours, total_seconds = divmod(total_seconds, 3600)
        minutes, seconds = divmod(total_seconds, 60)
        
        parts = []
        if months: parts.append(f"{months} month{'s' if months > 1 else ''}")
        if weeks: parts.append(f"{weeks} week{'s' if weeks > 1 else ''}")
        if days: parts.append(f"{days} day{'s' if days > 1 else ''}")
        if hours: parts.append(f"{hours} hour{'s' if hours > 1 else ''}")
        if minutes: parts.append(f"{minutes} minute{'s' if minutes > 1 else ''}")
        if seconds: parts.append(f"{seconds} second{'s' if seconds > 1 else ''}")
        
        return " ".join(parts) if parts else "0 seconds"

class TaskSerializer(serializers.ModelSerializer):
    subtasks = serializers.SerializerMethodField()
    estimated_duration = HumanReadableDurationField(required=False, allow_null=True)

    class Meta:
        model = Task
        fields = (
            'id', 'title', 'description', 'status', 'priority', 'parent_task', 
            'estimated_duration', 'due_date', 'created_at', 'updated_at', 'subtasks',
            'team', 'assignees', 'is_recurring', 'recurrence_schedule'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            # Data Isolation: Only allow selecting parent tasks that belong to the current user or their teams
            from django.db.models import Q
            self.fields['parent_task'].queryset = Task.objects.filter(
                Q(user=request.user) | Q(team__memberships__user=request.user)
            ).distinct()

    def get_subtasks(self, obj):
        return [task.id for task in obj.subtasks.all()]

    def validate(self, data):
        """
        Validate task dates.
        """
        due_date = data.get('due_date')
        if due_date:
            if due_date <= timezone.now():
                raise serializers.ValidationError({"due_date": "Due date must be in the future."})
        return data

    def get_subtasks(self, obj):
        if obj.subtasks.exists():
            return TaskSerializer(obj.subtasks.all(), many=True).data
        return []
