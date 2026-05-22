from rest_framework import viewsets, mixins, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.utils import timezone
from .models import TeamRoom, RoomChat, RoomChatFile
from .serializers import TeamRoomSerializer, RoomChatSerializer

class TeamRoomViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = TeamRoomSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return TeamRoom.objects.filter(team__memberships__user=self.request.user)

    @action(detail=True, methods=['get'])
    def chats(self, request, pk=None):
        room = self.get_object()
        chats = room.chats.all()
        page = self.paginate_queryset(chats)
        if page is not None:
            serializer = RoomChatSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = RoomChatSerializer(chats, many=True)
        return Response(serializer.data)

class RoomChatViewSet(mixins.CreateModelMixin, mixins.UpdateModelMixin, mixins.DestroyModelMixin, viewsets.GenericViewSet):
    serializer_class = RoomChatSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        return RoomChat.objects.filter(room__team__memberships__user=self.request.user)

    def perform_create(self, serializer):
        room = serializer.validated_data['room']
        if not room.team.memberships.filter(user=self.request.user).exists():
            from rest_framework.exceptions import ValidationError
            raise ValidationError("You are not a member of this team.")
        
        chat = serializer.save(sender=self.request.user)
        
        # Handle uploaded files
        files = self.request.FILES.getlist('uploaded_files')
        for f in files:
            room_file = RoomChatFile.objects.create(
                file=f,
                file_name=f.name,
                uploaded_by=self.request.user
            )
            chat.files.add(room_file)
