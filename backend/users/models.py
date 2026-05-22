import os
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.contrib.auth.base_user import BaseUserManager
from django.utils.translation import gettext_lazy as _
from .utils import generate_nano_id

class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError(_('The Email must be set'))
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save()
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError(_('Superuser must have is_staff=True.'))
        if extra_fields.get('is_superuser') is not True:
            raise ValueError(_('Superuser must have is_superuser=True.'))
        return self.create_user(email, password, **extra_fields)

class User(AbstractUser):
    id = models.CharField(max_length=16, primary_key=True, default=generate_nano_id, editable=False)
    username = models.CharField(max_length=150, blank=True, null=True, unique=True)
    email = models.EmailField(_('email address'), unique=True)
    bio = models.TextField(max_length=500, blank=True, null=True)
    
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    points = models.IntegerField(default=0)
    streak_count = models.IntegerField(default=0)
    last_activity_date = models.DateField(blank=True, null=True)

    @property
    def cluster(self):
        try:
            task_count = self.tasks.count()
            team_count = self.team_memberships.count()
            if task_count > 20 and team_count >= 2:
                return "Collaborative Master"
            elif task_count > 10:
                return "Active Planner"
            elif task_count > 0:
                return "Task Creator"
            return "Novice"
        except Exception:
            return "Novice"

    def award_points(self, amount):
        self.points += amount
        self.save()

    def record_activity(self):
        from django.utils import timezone
        from datetime import timedelta
        today = timezone.now().date()
        if self.last_activity_date != today:
            if self.last_activity_date == today - timedelta(days=1):
                self.streak_count += 1
            else:
                self.streak_count = 1
            self.last_activity_date = today
            self.save()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    objects = CustomUserManager()

    def __str__(self):
        return self.email
