from django.urls import path

# now import the views.py file into this code
from . import views

urlpatterns = [
    path("login/", views.login.as_view()),
    path("callback/", views.callback.as_view()),
    path("me/", views.GetMyData.as_view()),
    path(
        "me/request-email-verification/",
        views.RequestEmailVerification.as_view(),
        name="request-email-verification",
    ),
    path("me/verify-email/", views.VerifyEmail.as_view(), name="verify-email"),
    # Hanko onboarding endpoint (only used when AUTH_PROVIDER=hanko)
    path("onboarding/", views.OnboardingCallback.as_view(), name="onboarding-callback"),
    # Auth status check (for web component silent check)
    path("status/", views.AuthStatus.as_view(), name="auth-status"),
]
