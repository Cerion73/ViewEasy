from django.urls import path, include
from .views import GoogleLogin, TOTPSetupView, TOTPVerifyView

urlpatterns = [
    # dj-rest-auth standard endpoints (login, logout, user details, password reset)
    path('', include('dj_rest_auth.urls')),
    
    # Registration endpoints
    path('registration/', include('dj_rest_auth.registration.urls')),
    
    # Google OAuth2 Login
    path('google/', GoogleLogin.as_view(), name='google_login'),
    
    # 2FA endpoints
    path('2fa/setup/', TOTPSetupView.as_view(), name='totp_setup'),
    path('2fa/verify/', TOTPVerifyView.as_view(), name='totp_verify'),
]
