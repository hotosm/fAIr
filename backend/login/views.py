import json

from core.serializers import UserStatsSerializer
from django.conf import settings
from django.core.mail import send_mail
from django.http import JsonResponse
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

        serializer = UserStatsSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            if "email" in request.data and request.data["email"] != original_email:
                user.email_verified = False
                user.save(update_fields=["email_verified"])

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
