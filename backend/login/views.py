import json

from core.serializers import UserStatsSerializer
from django.conf import settings
from django.core.mail import send_mail
from django.http import JsonResponse, HttpResponseRedirect
from django.utils import timezone
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from osm_login_python.core import Auth
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from login.authentication import OsmAuthentication
from login.permissions import IsOsmAuthenticated

from .models import OsmUser
from .tokens import email_verification_token
from .hanko_helpers import (
    generate_synthetic_osm_id,
    find_legacy_user_by_osm_id,
    create_osm_user,
    is_real_osm_user,
)

# Create your views here.
# initialize osm_auth with our credentials
osm_auth = Auth(
    osm_url=settings.OSM_URL,
    client_id=settings.OSM_CLIENT_ID,
    client_secret=settings.OSM_CLIENT_SECRET,
    secret_key=settings.OSM_SECRET_KEY,
    login_redirect_uri=settings.OSM_LOGIN_REDIRECT_URI,
    scope=settings.OSM_SCOPE,
)


class login(APIView):
    def get(self, request, format=None):
        """Generates login url for OSM Login

        Args:
            request (get): _description_

        Returns:
            json: login_url
        """
        login_url = osm_auth.login()
        return JsonResponse(login_url)


class callback(APIView):
    def get(self, request, format=None):  # pragma: no cover
        """Callback method redirected from osm callback method

        Args:
            request (_type_): contains code and state as parametr redirected from osm

        Returns:
            json: access_token
        """
        # Generating token through osm_auth library method
        uri = request.build_absolute_uri()
        token = osm_auth.callback(uri)
        token["access_token"] = token.pop("user_data")
        return JsonResponse(token)


class GetMyData(APIView):
    authentication_classes = [OsmAuthentication]
    permission_classes = [IsOsmAuthenticated]

    def get(self, request, format=None):
        user = request.user
        user.last_login = timezone.now()
        user.save(update_fields=["last_login"])
        serialized_field = UserStatsSerializer(instance=user)
        return Response(serialized_field.data, status=status.HTTP_201_CREATED)

    @swagger_auto_schema(
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                "email": openapi.Schema(
                    type=openapi.TYPE_STRING, format=openapi.FORMAT_EMAIL
                )
            },
            required=["email"],
        )
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

            if "account_deletion_requested" in request.data and request.data["account_deletion_requested"] and not original_deletion_requested:
                send_mail(
                    subject="fAIr : Account deletion requested",
                    message=f"User {user.username} (OSM ID: {user.osm_id}) has requested account deletion.",
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=["fair@hotosm.org"],
                )

            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RequestEmailVerification(APIView):
    authentication_classes = [OsmAuthentication]
    permission_classes = [IsOsmAuthenticated]

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
            message=f"Hi , {user.username} \n Click this link to verify your email: {verify_link}. \n Regards, fAIr dev team",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
        )

        return Response({"message": "Verification email sent."}, status=200)


class VerifyEmail(APIView):
    # authentication_classes = [OsmAuthentication]
    # permission_classes = [IsOsmAuthenticated]

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
            user.save()
            return Response({"message": "Email successfully verified."}, status=200)
        else:
            return Response({"error": "Invalid or expired token."}, status=400)


class OnboardingCallback(APIView):
    """Handle onboarding callback from login service.

    This endpoint is called after the user completes onboarding in login.hotosm.test.
    It creates the OsmUser and mapping based on whether the user is new or legacy.

    Query params:
    - new_user=true: User is new, generate synthetic osm_id
    - (no param): User is legacy, osm_connection cookie should be set

    Only works when AUTH_PROVIDER=hanko.
    """

    def get(self, request):
        from django.conf import settings
        from hotosm_auth.integrations.django import create_user_mapping

        # Only for Hanko auth
        if getattr(settings, 'AUTH_PROVIDER', 'legacy') != 'hanko':
            return Response(
                {"error": "Onboarding only available with Hanko auth"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Need Hanko user from middleware
        if not hasattr(request, 'hotosm') or not request.hotosm.user:
            return Response(
                {"error": "Not authenticated with Hanko"},
                status=status.HTTP_401_UNAUTHORIZED
            )

        hanko_user = request.hotosm.user
        is_new_user = request.query_params.get('new_user') == 'true'

        if is_new_user:
            # New user - generate synthetic osm_id
            osm_id = generate_synthetic_osm_id(hanko_user.id)
            username = hanko_user.email.split('@')[0]  # Use email prefix as username

            # Create OsmUser
            user = create_osm_user(
                osm_id=osm_id,
                username=username,
                email=hanko_user.email,
            )

            # Create mapping
            create_user_mapping(
                hanko_user_id=hanko_user.id,
                app_user_id=str(osm_id),
                app_name="fair",
            )

            # Redirect to fAIr homepage
            frontend_url = getattr(settings, 'FRONTEND_URL', '/')
            return HttpResponseRedirect(frontend_url)

        else:
            # Legacy user - should have osm_connection cookie
            osm_connection = request.hotosm.osm

            if not osm_connection:
                return Response(
                    {"error": "OSM connection required for legacy users"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            osm_id = osm_connection.osm_user_id

            # Check if OsmUser already exists (true legacy)
            existing_user = find_legacy_user_by_osm_id(osm_id)

            if not existing_user:
                # No existing fAIr account with this OSM ID
                # Redirect back to Login with error message
                from urllib.parse import urlencode, quote
                login_url = getattr(settings, 'LOGIN_URL', 'https://login.hotosm.org')
                frontend_url = getattr(settings, 'FRONTEND_URL', '/')
                error_msg = f"No existing account found for '{osm_connection.osm_username}'. Please select 'No, I'm new' to create a new account."
                params = urlencode({
                    'onboarding': 'fair',
                    'return_to': frontend_url,
                    'error': error_msg,
                })
                return HttpResponseRedirect(f"{login_url}/app?{params}")

            # True legacy user - create mapping
            create_user_mapping(
                hanko_user_id=hanko_user.id,
                app_user_id=str(osm_id),
                app_name="fair",
            )

            # Redirect to fAIr homepage
            frontend_url = getattr(settings, 'FRONTEND_URL', '/')
            return HttpResponseRedirect(frontend_url)


class AuthStatus(APIView):
    """Check authentication status for Hanko users.

    Returns:
    - authenticated: true if user has valid mapping
    - needs_onboarding: true if user needs to complete onboarding
    - hanko_user: Hanko user info if authenticated with Hanko

    Only works when AUTH_PROVIDER=hanko.
    """

    def get(self, request):
        from django.conf import settings
        from hotosm_auth.integrations.django import get_mapped_user_id

        # Only for Hanko auth
        if getattr(settings, 'AUTH_PROVIDER', 'legacy') != 'hanko':
            return Response({
                "auth_provider": "legacy",
                "authenticated": request.user.is_authenticated if hasattr(request, 'user') else False,
            })

        # Check Hanko user
        if not hasattr(request, 'hotosm') or not request.hotosm.user:
            return Response({
                "auth_provider": "hanko",
                "authenticated": False,
                "hanko_authenticated": False,
            })

        hanko_user = request.hotosm.user

        # Check mapping
        mapped_osm_id = get_mapped_user_id(hanko_user, app_name="fair")

        if mapped_osm_id is not None:
            # Has mapping - fully authenticated
            try:
                osm_id = int(mapped_osm_id)
                user = OsmUser.objects.get(osm_id=osm_id)
                return Response({
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
                    }
                })
            except OsmUser.DoesNotExist:
                pass  # Fall through to needs_onboarding

        # No mapping - needs onboarding
        return Response({
            "auth_provider": "hanko",
            "authenticated": False,
            "needs_onboarding": True,
            "hanko_authenticated": True,
            "hanko_user": {
                "id": hanko_user.id,
                "email": hanko_user.email,
            }
        })
