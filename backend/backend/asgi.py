import os
from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
django_asgi_app = get_asgi_application()

from channels.routing import ProtocolTypeRouter, URLRouter
from notifications.routing import websocket_urlpatterns as notif_ws
from direct_messages.routing import websocket_urlpatterns as dm_ws
from team_rooms.routing import websocket_urlpatterns as room_ws

websocket_urlpatterns = notif_ws + dm_ws + room_ws
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from django.conf import settings
from users.models import User
import jwt
from http import cookies

@database_sync_to_async
def get_user(user_id):
    try:
        return User.objects.get(id=user_id)
    except User.DoesNotExist:
        return AnonymousUser()

from django.core.signing import loads, BadSignature

class JWTAuthMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        from urllib.parse import parse_qs
        query_string = scope.get("query_string", b"").decode()
        query_params = parse_qs(query_string)
        
        scope["user"] = AnonymousUser()
        
        if "ticket" in query_params:
            ticket = query_params["ticket"][0]
            try:
                data = loads(ticket, salt="ws-ticket", max_age=60) # Ticket valid for 60 seconds
                scope["user"] = await get_user(data.get("user_id"))
            except BadSignature:
                pass
                
        return await self.app(scope, receive, send)

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": JWTAuthMiddleware(
        URLRouter(
            websocket_urlpatterns
        )
    ),
})
