from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    cluster = serializers.ReadOnlyField()
    
    class Meta:
        model = User
        fields = ('id', 'email', 'username', 'first_name', 'last_name', 'bio', 'avatar', 'points', 'streak_count', 'cluster', 'is_active', 'date_joined')
        read_only_fields = ('id', 'email', 'is_active', 'date_joined', 'points', 'streak_count', 'cluster')
