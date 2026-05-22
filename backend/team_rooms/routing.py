from django.urls import path
from . import consumers

websocket_urlpatterns = [
    path('ws/rooms/<int:room_id>/', consumers.RoomConsumer.as_asgi()),
]
