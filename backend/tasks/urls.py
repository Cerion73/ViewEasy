from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TaskViewSet, TeamViewSet, InvitationViewSet, DailyAchievementViewSet

router = DefaultRouter()
router.register(r'teams', TeamViewSet, basename='team')
router.register(r'invitations', InvitationViewSet, basename='invitation')
router.register(r'daily-achievements', DailyAchievementViewSet, basename='daily-achievement')
router.register(r'', TaskViewSet, basename='task')

urlpatterns = [
    path('', include(router.urls)),
]
