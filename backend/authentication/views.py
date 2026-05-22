from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from dj_rest_auth.registration.views import SocialLoginView
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.authentication import BasicAuthentication
from django_otp.plugins.otp_totp.models import TOTPDevice
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
import qrcode
import base64
from io import BytesIO

from django.db import transaction
from rest_framework import status

@method_decorator(csrf_exempt, name='dispatch')
class GoogleLogin(SocialLoginView):
    adapter_class = GoogleOAuth2Adapter
    callback_url = "http://localhost:5173/login"
    client_class = OAuth2Client
    authentication_classes = []  # No session auth = no CSRF enforcement
    permission_classes = [AllowAny]

    @transaction.atomic
    def post(self, request, *args, **kwargs):
        sid = transaction.savepoint()
        try:
            self.request = request
            self.serializer = self.get_serializer(data=self.request.data)
            self.serializer.is_valid(raise_exception=True)
            
            user = self.serializer.validated_data.get('user')
            password = request.data.get('password')
            
            if user and user.has_usable_password():
                if not password:
                    transaction.savepoint_rollback(sid)
                    return Response({
                        "requires_password_verification": True,
                        "email": user.email,
                        "message": "Please verify your password to link your Google account."
                    }, status=status.HTTP_401_UNAUTHORIZED)
                
                if not user.check_password(password):
                    transaction.savepoint_rollback(sid)
                    return Response({"error": "Invalid password"}, status=status.HTTP_400_BAD_REQUEST)
            
            transaction.savepoint_commit(sid)
            self.login()
            return self.get_response()
            
        except Exception as e:
            transaction.savepoint_rollback(sid)
            raise e

class TOTPSetupView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        device, created = TOTPDevice.objects.get_or_create(user=user, name='default')
        url = device.config_url
        
        # Generate QR code
        qr = qrcode.make(url)
        buffer = BytesIO()
        qr.save(buffer, format="PNG")
        qr_base64 = base64.b64encode(buffer.getvalue()).decode("utf-8")
        
        return Response({
            "qr_code": f"data:image/png;base64,{qr_base64}",
            "secret": device.key
        })

class TOTPVerifyView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        token = request.data.get('token')
        user = request.user
        device = TOTPDevice.objects.filter(user=user, name='default').first()
        if not device:
            return Response({"error": "No TOTP device setup"}, status=400)
        
        if device.verify_token(token):
            if not device.confirmed:
                device.confirmed = True
                device.save()
            return Response({"success": True})
        return Response({"error": "Invalid token"}, status=400)

from django.core.signing import dumps

class WSTicketView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Generates a short-lived secure ticket for WebSocket connections"""
        ticket = dumps({"user_id": request.user.id}, salt="ws-ticket")
        return Response({"ticket": ticket})
