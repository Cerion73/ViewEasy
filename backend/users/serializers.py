import os
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError

User = get_user_model()

def validate_avatar(value):
    ext = os.path.splitext(value.name)[1].lower()
    valid_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp']
    if ext not in valid_extensions:
        raise ValidationError(f'Unsupported image format: {ext}. Allowed: {", ".join(valid_extensions)}')
    if value.size > 5 * 1024 * 1024:
        raise ValidationError('Avatar must be under 5MB.')

class UserSerializer(serializers.ModelSerializer):
    cluster = serializers.ReadOnlyField()
    
    class Meta:
        model = User
        fields = ('id', 'email', 'username', 'first_name', 'last_name', 'bio', 'avatar', 'points', 'streak_count', 'cluster', 'is_active', 'date_joined')
        read_only_fields = ('id', 'email', 'is_active', 'date_joined', 'points', 'streak_count', 'cluster')

    def validate_avatar(self, value):
        validate_avatar(value)
        return value
