from rest_framework import serializers
from .models import Task

class TaskSerializer(serializers.ModelSerializer):
    subtasks = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = (
            'id', 'title', 'description', 'status', 'parent_task', 
            'estimated_duration', 'due_date', 'created_at', 'updated_at', 'subtasks'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            # Data Isolation: Only allow selecting parent tasks that belong to the current user
            self.fields['parent_task'].queryset = Task.objects.filter(user=request.user)

    def get_subtasks(self, obj):
        if obj.subtasks.exists():
            return TaskSerializer(obj.subtasks.all(), many=True).data
        return []
