from rest_framework import generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from django.utils import timezone
from tasks.models import Task
from .serializers import UserSerializer

User = get_user_model()

class UserProfileStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        now = timezone.now()
        
        tasks = Task.objects.filter(user=user)
        total = tasks.count()
        
        days_joined = (now.date() - user.date_joined.date()).days
        if days_joined <= 0:
            days_joined = 1
            
        daily_avg = round(total / days_joined, 1)
        weekly_avg = round(daily_avg * 7, 1)
        monthly_avg = round(daily_avg * 30, 1)
        quarterly_avg = round(daily_avg * 90, 1)
        yearly_avg = round(daily_avg * 365, 1)
        
        return Response({
            'daily': daily_avg,
            'weekly': weekly_avg,
            'monthly': monthly_avg,
            'quarterly': quarterly_avg,
            'yearly': yearly_avg,
            'total': total
        })

class UserProfileView(generics.RetrieveUpdateAPIView):
    """
    Get or update the currently authenticated user's profile.
    Ensures strict self-access.
    """
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class UserListView(generics.ListAPIView):
    """
    List and search users for messaging and discovering profiles.
    """
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = User.objects.exclude(id=self.request.user.id)
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(email__icontains=search)
        return queryset


class PublicProfileView(generics.RetrieveAPIView):
    """
    Retrieve public information for a specific user.
    """
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    queryset = User.objects.all()
