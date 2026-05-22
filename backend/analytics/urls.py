from django.urls import path
from .views import UnwrappedAnalyticsView

urlpatterns = [
    path('tasks/stats/', UnwrappedAnalyticsView.as_view(), name='task-stats'),
]
