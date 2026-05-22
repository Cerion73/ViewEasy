from django.urls import path
from . import consumers

websocket_urlpatterns = [
    path('ws/dm/', consumers.DMConsumer.as_asgi()),
]
