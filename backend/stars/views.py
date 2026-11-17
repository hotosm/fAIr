from django.db import IntegrityError, transaction
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import serializers, status
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework.views import APIView

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


@extend_schema(tags=["stars"])
class StarView(APIView):
    permission_classes = [IsAuthenticatedOrReadOnly]
    serializer_class = StarStateResponse

    def _target_id(self, request) -> str:
        target_id = request.query_params.get("target_id", "").strip()
        if not target_id:
            raise ValueError("target_id query parameter is required")
        return target_id

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
        starred = (
            request.user.is_authenticated
            and Star.objects.filter(target_id=target_id, user=request.user).exists()
        )
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

        try:
            with transaction.atomic():
                Star.objects.create(target_id=target_id, user=request.user)
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

        Star.objects.filter(target_id=target_id, user=request.user).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
