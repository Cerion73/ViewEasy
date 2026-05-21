from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Task
from .serializers import TaskSerializer

class TaskViewSet(viewsets.ModelViewSet):
    """
    A viewset for viewing and editing user tasks.
    It provides standard CRUD operations (list, create, retrieve, update, destroy).
    """
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Overrides the default queryset to implement strict object-level permissions.
        Ensures that a user can only view or interact with their own tasks.
        """
        return Task.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        """
        Overrides the default creation behavior to automatically associate
        the newly created task with the currently authenticated user.
        """
        serializer.save(user=self.request.user)

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
