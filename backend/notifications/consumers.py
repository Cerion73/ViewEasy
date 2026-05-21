import json
from channels.generic.websocket import AsyncWebsocketConsumer

class NotificationConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer that handles real-time push notifications for users.
    Connects authenticated users to a personal Redis channel group, enabling
    Celery tasks and other backend processes to instantly push data to their frontend.
    """
    
    async def connect(self):
        """
        Called when a WebSocket connection is initiated.
        Rejects anonymous users. Assigns authenticated users to a unique
        group named 'user_{user_id}' to receive targeted messages.
        """
        # Allow connection if user is authenticated (handled by AuthMiddlewareStack)
        if self.scope["user"].is_anonymous:
            await self.close()
        else:
            self.group_name = f"user_{self.scope['user'].id}"
            await self.channel_layer.group_add(
                self.group_name,
                self.channel_name
            )
            await self.accept()

    async def disconnect(self, close_code):
        """
        Called when the WebSocket closes.
        Removes the connection from the user's targeted Redis group.
        """
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(
                self.group_name,
                self.channel_name
            )

    async def send_notification(self, event):
        """
        Event handler triggered by async_to_sync(channel_layer.group_send).
        Formats the incoming server event and transmits it over the WebSocket to the client.
        """
        message = event["message"]
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            "type": "notification",
            "data": message
        }))

