from django.conf import settings
from django.urls import path

from config.settings import AuthProvider

# now import the views.py file into this code
from . import views

urlpatterns = [
    path("me/", views.GetMyData.as_view()),
    path(
        "me/request-email-verification/",
        views.RequestEmailVerification.as_view(),
        name="request-email-verification",
    ),
    path("me/verify-email/", views.VerifyEmail.as_view(), name="verify-email"),
    # Auth status check (for web component silent check)
    path("status/", views.AuthStatus.as_view(), name="auth-status"),
]

if settings.AUTH_PROVIDER == AuthProvider.HANKO:
    urlpatterns.append(
        path("onboarding/", views.OnboardingCallback.as_view(), name="onboarding-callback"),
    )
