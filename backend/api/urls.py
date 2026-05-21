from django.urls import path, include

urlpatterns = [
    path('auth/', include('authentication.urls')),
    path('users/', include('users.urls')),
    path('tasks/', include('tasks.urls')),
    path('analytics/', include('analytics.urls')),
    path('notifications/', include('notifications.urls')),
]
