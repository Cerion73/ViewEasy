from django.db import models
from django.conf import settings
from simple_history.models import HistoricalRecords
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
import json
from datetime import timedelta
from django.utils import timezone
import uuid
import logging
from users.utils import generate_nano_id

logger = logging.getLogger(__name__)

class SoftDeleteManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(is_deleted=False)

class SoftDeleteModel(models.Model):
    id = models.CharField(max_length=16, primary_key=True, default=generate_nano_id, editable=False)
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)
    is_permanently_deleted = models.BooleanField(default=False)

    objects = SoftDeleteManager()
    all_objects = models.Manager()

    class Meta:
        abstract = True

    def delete(self, using=None, keep_parents=False):
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save(using=using)
        
        # Soft-delete all cascading subtasks if this is a Task
        if hasattr(self, 'subtasks'):
            for subtask in self.subtasks.all():
                subtask.delete(using=using, keep_parents=keep_parents)

    def hard_delete(self, using=None, keep_parents=False):
        super().delete(using=using, keep_parents=keep_parents)

class Team(SoftDeleteModel):
    name = models.CharField(max_length=255)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='owned_teams')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class TeamMembership(SoftDeleteModel):
    ROLE_CHOICES = (
        ('viewer', 'Viewer'),
        ('editor', 'Editor'),
        ('manager', 'Manager'),
    )
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='memberships')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='team_memberships')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='viewer')
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('team', 'user')

class Invitation(SoftDeleteModel):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
    )
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='invitations')
    email = models.EmailField() # Or username if matching inside system
    token = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    invited_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_invitations')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Invite to {self.email} for {self.team.name}"

class DailyAchievement(SoftDeleteModel):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='daily_achievements')
    date = models.DateField(default=timezone.now)
    content = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'date')

    def __str__(self):
        return f"Achievement on {self.date} by {self.user.username}"

class Task(SoftDeleteModel):
    """
    Represents a single task or to-do item created by a user.
    Maintains a relationship to the custom User model.
    Includes simple_history's HistoricalRecords to automatically track 
    any changes (creation, updates, deletion) to the model instance.
    """
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('overdue', 'Overdue'),
    )

    PRIORITY_CHOICES = (
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    )

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='tasks')
    
    # Collaborative fields
    team = models.ForeignKey(Team, on_delete=models.CASCADE, null=True, blank=True, related_name='tasks')
    assignees = models.ManyToManyField(settings.AUTH_USER_MODEL, blank=True, related_name='assigned_tasks')

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    
    # Subtasks
    parent_task = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='subtasks')
    
    # Time estimation
    estimated_duration = models.DurationField(null=True, blank=True, help_text="Estimated duration (e.g., '1 02:00:00' for 1 day, 2 hours)")
    
    # Recurring Task Engine
    is_recurring = models.BooleanField(default=False)
    # JSON mapping: {"monday": "09:00", "wednesday": "14:30"}
    recurrence_schedule = models.JSONField(null=True, blank=True)

    due_date = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # audit tracking
    history = HistoricalRecords()

    def __str__(self):
        """String representation for Django Admin and debugging."""
        return f"{self.title} ({self.status})"

@receiver(post_save, sender=Task)
def handle_recurring_task(sender, instance, created, **kwargs):
    if not created and instance.status == 'completed' and instance.is_recurring:
        # Disable recurrence on the completed task so it only triggers once
        Task.objects.filter(pk=instance.pk).update(is_recurring=False)
        
        if instance.recurrence_schedule:
            # Simple clone for next day if no complex parser is available immediately
            from django.utils import timezone
            from datetime import timedelta
            
            # Clone the task
            new_task = Task.objects.get(pk=instance.pk)
            new_task.pk = None
            new_task.status = 'pending'
            new_task.is_recurring = True
            
            # Basic fallback: +1 day. 
            # (In a real scenario, parse the recurrence_schedule JSON to find the exact next day/time)
            if new_task.due_date:
                new_task.due_date = new_task.due_date + timedelta(days=1)
            else:
                new_task.due_date = timezone.now() + timedelta(days=1)
                
            new_task.save()
            
            # Copy assignees
            for assignee in instance.assignees.all():
                new_task.assignees.add(assignee)

@receiver(post_save, sender=Task)
@receiver(post_delete, sender=Task)
def broadcast_task_update(sender, instance, **kwargs):
    """
    Sends a real-time WebSocket notification to the task owner 
    whenever a task is created, modified, or deleted.
    """
    channel_layer = get_channel_layer()
    group_name = f"user_{instance.user.id}"
    
    # Notify the user that they should refetch tasks or update their UI
    try:
        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                "type": "send_notification",
                "message": "TASK_SYNC",
            }
        )
    except Exception as e:
        logger.warning(f"Failed to send TASK_SYNC WebSocket notification: {e}")
