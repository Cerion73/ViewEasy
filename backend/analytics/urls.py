from django.urls import path
from .views import TaskStatisticsView

urlpatterns = [
    path('stats/', TaskStatisticsView.as_view(), name='task_stats'),
]
