from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from dj_rest_auth.registration.views import SocialLoginView
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_otp.plugins.otp_totp.models import TOTPDevice
import qrcode
import base64
from io import BytesIO

class GoogleLogin(SocialLoginView):
    adapter_class = GoogleOAuth2Adapter
    callback_url = "http://localhost:5173/login"
    client_class = OAuth2Client

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
