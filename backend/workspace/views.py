from django.conf import settings
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import serializers, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.authentication import OsmAuthentication

from .serializers import WorkspaceListingSerializer, WorkspacePresignedSerializer


class WorkspaceErrorResponse(serializers.Serializer):
    detail = serializers.CharField()


@extend_schema(tags=["workspace"])
class WorkspaceListView(APIView):
    """S3 listing scoped to a prefix; returns folders+files for a tree view."""

    authentication_classes = [OsmAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = WorkspaceListingSerializer

    @extend_schema(
        parameters=[OpenApiParameter("prefix", str, OpenApiParameter.QUERY)],
        responses={200: WorkspaceListingSerializer, 503: WorkspaceErrorResponse},
    )
    def get(self, request) -> Response:
        prefix = request.query_params.get("prefix", "")
        bucket = settings.BUCKET_NAME
        if not bucket:
            return Response(
                {"detail": "S3 bucket not configured."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        resp = settings.S3_CLIENT.list_objects_v2(Bucket=bucket, Prefix=prefix, Delimiter="/")
        folders = [
            {"name": p["Prefix"].rstrip("/").split("/")[-1], "prefix": p["Prefix"]}
            for p in resp.get("CommonPrefixes", [])
        ]
        files = [
            {
                "key": obj["Key"],
                "size": obj["Size"],
                "last_modified": obj["LastModified"].isoformat(),
            }
            for obj in resp.get("Contents", [])
        ]
        return Response(WorkspaceListingSerializer({"folders": folders, "files": files}).data)


@extend_schema(tags=["workspace"])
class WorkspacePresignedView(APIView):
    """Generate a fresh presigned URL for a single S3 object key."""

    authentication_classes = [OsmAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = WorkspacePresignedSerializer

    @extend_schema(
        parameters=[OpenApiParameter("key", str, OpenApiParameter.QUERY, required=True)],
        responses={
            200: WorkspacePresignedSerializer,
            400: WorkspaceErrorResponse,
            503: WorkspaceErrorResponse,
        },
    )
    def get(self, request) -> Response:
        key = request.query_params.get("key")
        if not key:
            return Response(
                {"detail": "Missing 'key' query parameter."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        bucket = settings.BUCKET_NAME
        if not bucket:
            return Response(
                {"detail": "S3 bucket not configured."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        url = settings.S3_CLIENT.generate_presigned_url(
            "get_object",
            Params={"Bucket": bucket, "Key": key},
            ExpiresIn=settings.PRESIGNED_URL_EXPIRY,
        )
        return Response(
            WorkspacePresignedSerializer(
                {"url": url, "expires_in": settings.PRESIGNED_URL_EXPIRY}
            ).data
        )
