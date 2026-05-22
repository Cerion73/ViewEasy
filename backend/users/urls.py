from django.urls import path
from .views import UserProfileView, UserProfileStatsView, UserListView, PublicProfileView

urlpatterns = [
    path('profile/', UserProfileView.as_view(), name='user-profile'),
    path('me/profile_stats/', UserProfileStatsView.as_view(), name='profile-stats'),
    path('', UserListView.as_view(), name='user-list'),
    path('<int:pk>/', PublicProfileView.as_view(), name='public-profile'),
]
