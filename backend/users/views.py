from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from .serializers import UserSerializer

User = get_user_model()

class UserProfileView(generics.RetrieveUpdateAPIView):
    """
    Get or update the currently authenticated user's profile.
    Ensures strict self-access.
    """
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user
