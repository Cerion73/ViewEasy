from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TeamRoomViewSet, RoomChatViewSet

router = DefaultRouter()
router.register(r'rooms', TeamRoomViewSet, basename='teamroom')
router.register(r'chats', RoomChatViewSet, basename='roomchat')

urlpatterns = [
    path('', include(router.urls)),
]
