import os
from rest_framework import viewsets, mixins, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.exceptions import ValidationError
from django.db.models import Count
from django.utils import timezone
from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer

ALLOWED_MEDIA_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.mp3', '.wav', '.ogg', '.m4a', '.webm', '.pdf', '.doc', '.docx', '.txt'}
MAX_MEDIA_SIZE = 20 * 1024 * 1024

class ConversationViewSet(viewsets.ModelViewSet):
    serializer_class = ConversationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Conversation.objects.filter(participants=self.request.user)

    def create(self, request, *args, **kwargs):
        other_user_id = request.data.get('user_id')
        if not other_user_id:
            return Response({"error": "user_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        existing = Conversation.objects.annotate(count=Count('participants')).filter(
            count=2,
            participants=request.user
        ).filter(participants__id=other_user_id).first()

        if existing:
            return Response(self.get_serializer(existing).data)

        from users.models import User
        try:
            other_user = User.objects.get(id=other_user_id)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        conv = Conversation.objects.create()
        conv.participants.add(request.user, other_user)
        return Response(self.get_serializer(conv).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'])
    def messages(self, request, pk=None):
        conversation = self.get_object()
        msgs = conversation.messages.all()
        page = self.paginate_queryset(msgs)
        if page is not None:
            serializer = MessageSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = MessageSerializer(msgs, many=True)
        return Response(serializer.data)


class MessageViewSet(mixins.CreateModelMixin, mixins.UpdateModelMixin, mixins.DestroyModelMixin, viewsets.GenericViewSet):
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        return Message.objects.filter(conversation__participants=self.request.user)

    def perform_create(self, serializer):
        conv = serializer.validated_data['conversation']
        if self.request.user not in conv.participants.all():
            raise ValidationError("Not a participant in this conversation.")
        
        media_file = self.request.FILES.get('media')
        if media_file:
            ext = os.path.splitext(media_file.name)[1].lower()
            if ext not in ALLOWED_MEDIA_EXTENSIONS:
                raise ValidationError(f'File type "{ext}" is not allowed.')
            if media_file.size > MAX_MEDIA_SIZE:
                raise ValidationError('File must be under 20MB.')
        
        serializer.save(sender=self.request.user)
        conv.updated_at = timezone.now()
        conv.save()
