from django.conf import settings
from django.core.mail import send_mail
from django.http import HttpResponseRedirect
from django.utils import timezone
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.authentication import OsmAuthentication
from config.settings import AuthProvider
from notifications.serializers import UserStatsSerializer
from shared.exceptions import AuthenticationException, LoginException

from .api_schemas import (
    AuthStatusResponse,
    EmailVerifyQueryResponse,
    ErrorResponse,
    MessageResponse,
)
from .hanko_helpers import (
    create_osm_user,
    find_legacy_user_by_osm_id,
    generate_synthetic_osm_id,
    is_real_osm_user,
)
from .models import OsmUser
from .tokens import email_verification_token


@extend_schema(tags=["accounts"])
class GetMyData(APIView):
    authentication_classes = [OsmAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = UserStatsSerializer

    @extend_schema(
        description="Return the caller's profile and update last_login.",
        responses=UserStatsSerializer,
    )
    def get(self, request, format=None):
        user = request.user
        user.last_login = timezone.now()
        user.save(update_fields=["last_login"])
        serialized_field = UserStatsSerializer(instance=user)
        return Response(serialized_field.data, status=status.HTTP_201_CREATED)

    @extend_schema(
        description="Extend the caller's profile (email, deletion-request, prefs).",
        request=UserStatsSerializer,
        responses=UserStatsSerializer,
    )
    def patch(self, request, format=None):
        user = request.user

        original_email = user.email
        original_deletion_requested = user.account_deletion_requested

        serializer = UserStatsSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()

            if "email" in request.data and request.data["email"] != original_email:
                user.email_verified = False
                user.save(update_fields=["email_verified"])

            if (
                "account_deletion_requested" in request.data
                and request.data["account_deletion_requested"]
                and not original_deletion_requested
            ):
                send_mail(
                    subject="fAIr : Account deletion requested",
                    message=(
                        f"User {user.username} (OSM ID: {user.osm_id}) "
                        f"has requested account deletion."
                    ),
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=["fair@hotosm.org"],
                )

            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(tags=["accounts"])
class RequestEmailVerification(APIView):
    authentication_classes = [OsmAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = MessageResponse

    @extend_schema(
        description="Send the caller a verification email; 400 if already verified or no email.",
        request=None,
        responses={200: MessageResponse, 400: MessageResponse},
    )
    def post(self, request, format=None):
        user = request.user
        if user.email_verified:
            return Response(
                {"message": "Email already verified"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not user.email or user.email == "":
            return Response(
                {"message": "Email address not found"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        uid = urlsafe_base64_encode(force_bytes(user.osm_id))
        token = email_verification_token.make_token(user)
        verify_link = f"{settings.FRONTEND_URL}/verify-email/?uid={uid}&token={token}"

        send_mail(
            subject="fAIr : Verify your email",
            message=(
                f"Hi , {user.username} \n"
                f"Click this link to verify your email: {verify_link}. \n"
                f"Regards, fAIr dev team"
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
        )

        return Response({"message": "Verification email sent."}, status=200)


@extend_schema(tags=["accounts"])
class VerifyEmail(APIView):
    permission_classes = [AllowAny]
    serializer_class = EmailVerifyQueryResponse

    @extend_schema(
        description="Validate an email-verification token and mark the user verified.",
        parameters=[
            OpenApiParameter("uid", str, OpenApiParameter.QUERY, required=True),
            OpenApiParameter("token", str, OpenApiParameter.QUERY, required=True),
        ],
        responses={200: MessageResponse, 201: MessageResponse, 400: ErrorResponse},
    )
    def get(self, request, format=None):
        uidb64 = request.query_params.get("uid")
        token = request.query_params.get("token")
        if not uidb64 or not token:
            return Response({"error": "Missing UID or token."}, status=400)

        try:
            osm_id = urlsafe_base64_decode(uidb64).decode()
            user = OsmUser.objects.get(osm_id=osm_id)
        except (OsmUser.DoesNotExist, ValueError, TypeError):
            return Response({"error": "Invalid user."}, status=400)

        if user.email_verified:
            return Response({"message": "Email already verified."}, status=201)

        if email_verification_token.check_token(user, token):
            if user.email_verified:
                return Response({"message": "Email already verified."}, status=201)

            user.email_verified = True
            user.save(update_fields=["email_verified"])
            return Response({"message": "Email successfully verified."}, status=200)
        else:
            return Response({"error": "Invalid or expired token."}, status=400)


@extend_schema(tags=["accounts"])
class OnboardingCallback(APIView):
    """Onboarding callback from accounts service. Creates user mapping for Hanko auth."""

    permission_classes = [AllowAny]
    serializer_class = ErrorResponse

    @extend_schema(
        parameters=[OpenApiParameter("new_user", str, OpenApiParameter.QUERY)],
        responses={302: None, 400: ErrorResponse},
    )
    def get(self, request):
        from hotosm_auth_django import create_user_mapping

        if settings.AUTH_PROVIDER != AuthProvider.HANKO:
            return Response(
                {"error": "Onboarding only available with Hanko auth"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not hasattr(request, "hotosm") or not request.hotosm.user:
            raise AuthenticationException("Not authenticated with Hanko")

        hanko_user = request.hotosm.user
        is_new_user = request.query_params.get("new_user") == "true"

        if is_new_user:
            osm_id = generate_synthetic_osm_id(hanko_user.id)
            username = hanko_user.email.split("@")[0]

            create_osm_user(
                osm_id=osm_id,
                username=username,
                email=hanko_user.email,
                email_verified=True,
            )

            create_user_mapping(
                hanko_user_id=hanko_user.id,
                app_user_id=str(osm_id),
                app_name="fair",
            )

            frontend_url = settings.FRONTEND_URL
            return HttpResponseRedirect(frontend_url)

        else:
            osm_connection = request.hotosm.osm

            if not osm_connection:
                raise LoginException("OSM connection required for legacy users")

            osm_id = osm_connection.osm_user_id

            existing_user = find_legacy_user_by_osm_id(osm_id)

            if not existing_user:
                from urllib.parse import urlencode

                login_url = settings.LOGIN_URL
                frontend_url = settings.FRONTEND_URL
                error_msg = (
                    f"No existing account found for "
                    f"'{osm_connection.osm_username}'. "
                    f"Please select 'No, I'm new' to create a new account."
                )
                params = urlencode(
                    {
                        "onboarding": "fair",
                        "return_to": frontend_url,
                        "error": error_msg,
                    }
                )
                return HttpResponseRedirect(f"{login_url}/app?{params}")

            existing_user.email = hanko_user.email
            existing_user.email_verified = True
            existing_user.save(update_fields=["email", "email_verified"])

            create_user_mapping(
                hanko_user_id=hanko_user.id,
                app_user_id=str(osm_id),
                app_name="fair",
            )

            frontend_url = settings.FRONTEND_URL
            return HttpResponseRedirect(frontend_url)


@extend_schema(tags=["accounts"])
class AuthStatus(APIView):
    """Check authentication status."""

    permission_classes = [AllowAny]
    serializer_class = AuthStatusResponse

    @extend_schema(responses=AuthStatusResponse)
    def get(self, request):
        if settings.AUTH_PROVIDER == AuthProvider.DEV:
            authed = bool(getattr(request, "user", None) and request.user.is_authenticated)
            return Response({"auth_provider": "dev", "authenticated": authed})

        from hotosm_auth_django import get_mapped_user_id

        if not hasattr(request, "hotosm") or not request.hotosm.user:
            return Response(
                {
                    "auth_provider": "hanko",
                    "authenticated": False,
                    "hanko_authenticated": False,
                }
            )

        hanko_user = request.hotosm.user
        mapped_osm_id = get_mapped_user_id(hanko_user, app_name="fair")

        if mapped_osm_id is not None:
            try:
                osm_id = int(mapped_osm_id)
                user = OsmUser.objects.get(osm_id=osm_id)
                return Response(
                    {
                        "auth_provider": "hanko",
                        "authenticated": True,
                        "needs_onboarding": False,
                        "user": {
                            "osm_id": osm_id,
                            "username": user.username,
                            "is_real_osm": is_real_osm_user(osm_id),
                        },
                        "hanko_user": {
                            "id": hanko_user.id,
                            "email": hanko_user.email,
                        },
                    }
                )
            except OsmUser.DoesNotExist:
                pass

        return Response(
            {
                "auth_provider": "hanko",
                "authenticated": False,
                "needs_onboarding": True,
                "hanko_authenticated": True,
                "hanko_user": {
                    "id": hanko_user.id,
                    "email": hanko_user.email,
                },
            }
        )
