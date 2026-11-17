import httpx
from botocore.exceptions import BotoCoreError, ClientError, NoCredentialsError
from django.conf import settings
from django.db import connections
from django.db.utils import OperationalError
from drf_spectacular.utils import extend_schema
from rest_framework import serializers
from rest_framework.decorators import api_view, throttle_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import OsmUser
from feedback.models import Feedback
from modelregistry.models import LocalModel
from shared.enums import FeedbackAction, LocalModelStatus
from shared.integrations.stac import (
    BASE_MODELS_COLLECTION,
    DATASETS_COLLECTION,
    LOCAL_MODELS_COLLECTION,
)

_PROBE_TIMEOUT = settings.HEALTH_PROBE_TIMEOUT

_STAC_COLLECTIONS = [BASE_MODELS_COLLECTION, DATASETS_COLLECTION, LOCAL_MODELS_COLLECTION]


class _StacCollectionsSerializer(serializers.Serializer):
    base_models = serializers.BooleanField()
    datasets = serializers.BooleanField()
    local_models = serializers.BooleanField()


class HealthSerializer(serializers.Serializer):
    postgresql = serializers.BooleanField()
    s3 = serializers.BooleanField()
    stac_api = serializers.BooleanField()
    stac_collections = _StacCollectionsSerializer()
    zenml = serializers.BooleanField()


def _probe_http(client: httpx.Client, url: str) -> bool:
    try:
        client.get(url, follow_redirects=False)
    except httpx.HTTPError:
        return False
    return True


def _probe_http_ok(client: httpx.Client, url: str) -> bool:
    """Returns True only on a 2xx response; False on any error or non-2xx status."""
    try:
        return client.get(url, follow_redirects=True).is_success
    except httpx.HTTPError:
        return False


def _probe_postgres() -> bool:
    try:
        connections["default"].cursor()
    except OperationalError:
        return False
    return True


def _probe_s3() -> bool:
    try:
        settings.S3_CLIENT.head_bucket(Bucket=settings.BUCKET_NAME)
    except (BotoCoreError, ClientError, NoCredentialsError):
        return False
    return True


@extend_schema(
    tags=["system"],
    responses=HealthSerializer,
    auth=[],
    description=(
        "Liveness + reachability of every external dependency: postgresql, s3, "
        "stac_api, stac_collections (per-collection 2xx check), zenml."
    ),
)
@api_view(["GET"])
@throttle_classes([])
def health(request) -> Response:
    with httpx.Client(timeout=_PROBE_TIMEOUT) as client:
        payload = {
            "postgresql": _probe_postgres(),
            "s3": _probe_s3(),
            "stac_api": _probe_http(client, settings.FAIR_STAC_API_URL),
            "stac_collections": {
                collection_id.replace("-", "_"): _probe_http_ok(
                    client, f"{settings.FAIR_STAC_API_URL}/collections/{collection_id}"
                )
                for collection_id in _STAC_COLLECTIONS
            },
            "zenml": _probe_http(client, settings.FAIR_ZENML_STORE_URL),
        }
    return Response(payload)


class KpiStatsSerializer(serializers.Serializer):
    total_models_published = serializers.IntegerField()
    total_registered_users = serializers.IntegerField()
    total_feedback_labels = serializers.IntegerField()
    total_accepted_predictions = serializers.IntegerField()


class KpiStatsView(APIView):
    authentication_classes: list = []
    permission_classes = [AllowAny]
    throttle_classes: list = []

    @extend_schema(
        tags=["system"],
        responses=KpiStatsSerializer,
        auth=[],
        description=(
            "Public homepage counters: published models, registered users, "
            "feedback labels, accepted predictions."
        ),
    )
    def get(self, request) -> Response:
        return Response(
            {
                "total_models_published": LocalModel.objects.filter(
                    status=LocalModelStatus.ACTIVE
                ).count(),
                "total_registered_users": OsmUser.objects.count(),
                "total_feedback_labels": Feedback.objects.count(),
                "total_accepted_predictions": Feedback.objects.filter(
                    action=FeedbackAction.ACCEPT
                ).count(),
            }
        )
