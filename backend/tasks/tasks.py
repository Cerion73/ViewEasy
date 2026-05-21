from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
from .models import Task
from django.utils import timezone
from datetime import timedelta
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import logging

logger = logging.getLogger(__name__)

@shared_task
def send_task_reminders():
    """
    Background Celery task that scans for high-priority tasks (status: pending or in_progress)
    that are due within the next 24 hours. 
    It dispatches two forms of reminders:
    1. An email sent directly to the user's registered email address.
    2. A real-time WebSocket push notification using Django Channels.
    """
    now = timezone.now()
    upcoming_limit = now + timedelta(hours=24)
    
    # Find pending tasks that are due within the next 24 hours
    tasks_to_remind = Task.objects.filter(
        status__in=['pending', 'in_progress'],
        due_date__lte=upcoming_limit,
        due_date__gt=now
    )
    
    channel_layer = get_channel_layer()

    for task in tasks_to_remind:
        if task.user and task.user.email:
            try:
                # Send email notification
                send_mail(
                    subject=f"High Priority Reminder: {task.title} is due soon!",
                    message=f"Hello {task.user.username},\n\nYour task '{task.title}' is due at {task.due_date.strftime('%Y-%m-%d %H:%M')}.\n\nPlease check your ViewEasy dashboard.",
                    from_email=settings.EMAIL_HOST_USER,
                    recipient_list=[task.user.email],
                    fail_silently=True,
                )
                
                # Push WebSocket notification
                async_to_sync(channel_layer.group_send)(
                    f"user_{task.user.id}",
                    {
                        "type": "notify",
                        "content": {
                            "title": "Upcoming Task",
                            "message": f"'{task.title}' is due soon!"
                        }
                    }
                )
            except Exception as e:
                logger.error(f"Failed to send reminder for task {task.id}: {str(e)}")
