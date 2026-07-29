import hashlib

from django.db import IntegrityError, transaction
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import serializers, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.authentication import OsmAuthentication

from .models import Star


class StarStateResponse(serializers.Serializer):
    target_id = serializers.CharField()
    count = serializers.IntegerField()
    starred = serializers.BooleanField()


class StarPostResponse(serializers.Serializer):
    target_id = serializers.CharField()
    starred = serializers.BooleanField()
    count = serializers.IntegerField()
    created = serializers.BooleanField()


class StarErrorResponse(serializers.Serializer):
    detail = serializers.CharField()


_TARGET_ID_PARAM = OpenApiParameter("target_id", str, OpenApiParameter.QUERY, required=True)


def _anon_key(request) -> str:
    """Stable per-client key for anonymous starring; not personally identifying."""
    ip = request.META.get("REMOTE_ADDR", "")
    ua = request.META.get("HTTP_USER_AGENT", "")
    return hashlib.sha256(f"{ip}|{ua}".encode()).hexdigest()[:64]


@extend_schema(tags=["stars"])
class StarView(APIView):
    # Anonymous starring is keyed on a non-identifying SHA hash of
    # IP+UA so naive double-clicks dedupe without auth overhead.

    permission_classes = [AllowAny]
    authentication_classes = [OsmAuthentication]
    serializer_class = StarStateResponse

    def _target_id(self, request) -> str:
        target_id = request.query_params.get("target_id", "").strip()
        if not target_id:
            raise ValueError("target_id query parameter is required")
        return target_id

    def _identity(self, request) -> tuple[object | None, str]:
        user = (
            request.user
            if getattr(request, "user", None) and request.user.is_authenticated
            else None
        )
        anon = "" if user else _anon_key(request)
        return user, anon

    @extend_schema(
        parameters=[_TARGET_ID_PARAM],
        responses={200: StarStateResponse, 400: StarErrorResponse},
    )
    def get(self, request) -> Response:
        try:
            target_id = self._target_id(request)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        count = Star.objects.filter(target_id=target_id).count()
        user, anon = self._identity(request)
        if user is not None:
            starred = Star.objects.filter(target_id=target_id, user=user).exists()
        else:
            starred = Star.objects.filter(
                target_id=target_id, user__isnull=True, anon_key=anon
            ).exists()
        return Response({"target_id": target_id, "count": count, "starred": starred})

    @extend_schema(
        parameters=[_TARGET_ID_PARAM],
        request=None,
        responses={
            200: StarPostResponse,
            201: StarPostResponse,
            400: StarErrorResponse,
        },
    )
    def post(self, request) -> Response:
        try:
            target_id = self._target_id(request)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        user, anon = self._identity(request)
        try:
            with transaction.atomic():
                Star.objects.create(target_id=target_id, user=user, anon_key=anon)
            created = True
        except IntegrityError:
            created = False
        count = Star.objects.filter(target_id=target_id).count()
        return Response(
            {"target_id": target_id, "starred": True, "count": count, "created": created},
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )

    @extend_schema(
        parameters=[_TARGET_ID_PARAM],
        responses={204: None, 400: StarErrorResponse},
    )
    def delete(self, request) -> Response:
        try:
            target_id = self._target_id(request)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        user, anon = self._identity(request)
        if user is not None:
            Star.objects.filter(target_id=target_id, user=user).delete()
        else:
            Star.objects.filter(target_id=target_id, user__isnull=True, anon_key=anon).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
