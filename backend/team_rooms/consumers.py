import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from tasks.models import Team, TeamMembership

User = get_user_model()

@database_sync_to_async
def get_team_for_room(room_id):
    from .models import TeamRoom
    try:
        room = TeamRoom.objects.get(id=room_id)
        return room.team
    except TeamRoom.DoesNotExist:
        return None

@database_sync_to_async
def is_team_member(user, team):
    return TeamMembership.objects.filter(team=team, user=user).exists()

class RoomConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        user = self.scope["user"]
        self.room_id = self.scope['url_route']['kwargs']['room_id']
        self.room_group_name = f"room_{self.room_id}"

        if user.is_anonymous:
            await self.close()
            return

        team = await get_team_for_room(self.room_id)
        if not team or not await is_team_member(user, team):
            await self.close()
            return

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        action = data.get('action')

        if action == 'typing':
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'room_typing',
                    'sender_id': self.scope["user"].id,
                    'is_typing': data.get('is_typing', True)
                }
            )

    async def room_message(self, event):
        await self.send(text_data=json.dumps({
            'type': 'new_message',
            'message': event['message']
        }))

    async def room_typing(self, event):
        # Don't echo typing to sender
        if event['sender_id'] != self.scope["user"].id:
            await self.send(text_data=json.dumps({
                'type': 'typing',
                'sender_id': event['sender_id'],
                'is_typing': event['is_typing']
            }))
