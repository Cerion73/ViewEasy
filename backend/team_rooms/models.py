from django.db import models
from django.utils import timezone
from django.conf import settings
from tasks.models import Team
from users.utils import generate_nano_id

class TeamRoom(models.Model):
    id = models.CharField(max_length=16, primary_key=True, default=generate_nano_id, editable=False)
    team = models.OneToOneField(Team, on_delete=models.CASCADE, related_name='room')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Room for {self.team.name}"


class RoomChatFile(models.Model):
    id = models.CharField(max_length=16, primary_key=True, default=generate_nano_id, editable=False)
    file = models.FileField(upload_to='room_chat_files/%Y/%m/')
    file_name = models.CharField(max_length=255)
    uploaded_at = models.DateTimeField(default=timezone.now)
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)

    def __str__(self):
        return self.file_name


class RoomChat(models.Model):
    id = models.CharField(max_length=16, primary_key=True, default=generate_nano_id, editable=False)
    room = models.ForeignKey(TeamRoom, on_delete=models.CASCADE, related_name='chats')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='room_chats')
    content = models.TextField(blank=True)
    files = models.ManyToManyField(RoomChatFile, blank=True, related_name='chat_messages')
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Message from {self.sender} in {self.room.team.name}"


class RoomTypingStatus(models.Model):
    id = models.CharField(max_length=16, primary_key=True, default=generate_nano_id, editable=False)
    room = models.ForeignKey(TeamRoom, on_delete=models.CASCADE, related_name='typing_users')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    started_at = models.DateTimeField(default=timezone.now)
    expires_at = models.DateTimeField()

    class Meta:
        indexes = [
            models.Index(fields=['room', 'expires_at']),
        ]

    def __str__(self):
        return f"{self.user.username} typing in {self.room.team.name}"

from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=Team)
def create_team_room(sender, instance, created, **kwargs):
    if created:
        TeamRoom.objects.create(team=instance)
