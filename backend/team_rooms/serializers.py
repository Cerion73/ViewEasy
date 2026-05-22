from rest_framework import serializers
from .models import TeamRoom, RoomChat, RoomChatFile
from users.serializers import UserSerializer
from tasks.serializers import TeamSerializer

class RoomChatFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoomChatFile
        fields = ['id', 'file', 'file_name', 'uploaded_at', 'uploaded_by']

class RoomChatSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    files = RoomChatFileSerializer(many=True, read_only=True)

    class Meta:
        model = RoomChat
        fields = ['id', 'room', 'sender', 'content', 'files', 'created_at']
        read_only_fields = ['id', 'sender', 'created_at']

class TeamRoomSerializer(serializers.ModelSerializer):
    team = TeamSerializer(read_only=True)
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = TeamRoom
        fields = ['id', 'team', 'created_at', 'last_message']

    def get_last_message(self, obj):
        msg = obj.chats.order_by('-created_at').first()
        if msg:
            return RoomChatSerializer(msg).data
        return None
