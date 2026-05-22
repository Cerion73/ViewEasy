from django.db import models
from django.conf import settings
from tasks.models import Task
from users.utils import generate_nano_id

class Reminder(models.Model):
    id = models.CharField(max_length=16, primary_key=True, default=generate_nano_id, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='reminders')
    reminder_time = models.DateTimeField()
    is_sent = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Reminder for {self.task.title} at {self.reminder_time}"
