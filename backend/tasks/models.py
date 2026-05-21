from django.db import models
from django.conf import settings
from simple_history.models import HistoricalRecords

class Task(models.Model):
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

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='tasks')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Subtasks
    parent_task = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='subtasks')
    
    # Time estimation
    estimated_duration = models.DurationField(null=True, blank=True, help_text="Estimated duration (e.g., '1 02:00:00' for 1 day, 2 hours)")
    
    due_date = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # audit tracking
    history = HistoricalRecords()

    def __str__(self):
        """String representation for Django Admin and debugging."""
        return f"{self.title} ({self.status})"
