import json
from channels.generic.websocket import AsyncWebsocketConsumer

class DMConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        user = self.scope["user"]
        if user.is_anonymous:
            await self.close()
            return
            
        self.user_group_name = f"user_dm_{user.id}"
        await self.channel_layer.group_add(self.user_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'user_group_name'):
            await self.channel_layer.group_discard(self.user_group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        action = data.get('action')

        if action == 'typing':
            # expects: { "action": "typing", "conversation_id": 123, "is_typing": true, "receiver_id": 456 }
            receiver_id = data.get('receiver_id')
            if receiver_id:
                await self.channel_layer.group_send(
                    f"user_dm_{receiver_id}",
                    {
                        'type': 'dm_typing',
                        'conversation_id': data.get('conversation_id'),
                        'sender_id': self.scope["user"].id,
                        'is_typing': data.get('is_typing', True)
                    }
                )

    async def dm_message(self, event):
        # Called when a new DM is saved via API
        await self.send(text_data=json.dumps({
            'type': 'new_message',
            'message': event['message']
        }))

    async def dm_typing(self, event):
        await self.send(text_data=json.dumps({
            'type': 'typing',
            'conversation_id': event['conversation_id'],
            'sender_id': event['sender_id'],
            'is_typing': event['is_typing']
        }))
