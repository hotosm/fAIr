import asyncio

import httpx
from adrf.decorators import api_view
from asgiref.sync import sync_to_async
from botocore.exceptions import BotoCoreError, ClientError, NoCredentialsError
from django.conf import settings
from django.db import connections
from django.db.utils import OperationalError
from drf_spectacular.utils import extend_schema
from rest_framework import serializers
from rest_framework.response import Response

from shared.integrations.stac import (
    BASE_MODELS_COLLECTION,
    DATASETS_COLLECTION,
    LOCAL_MODELS_COLLECTION,
)

_PROBE_TIMEOUT = settings.HEALTH_PROBE_TIMEOUT

_STAC_COLLECTIONS = [BASE_MODELS_COLLECTION, DATASETS_COLLECTION, LOCAL_MODELS_COLLECTION]


class _MapswipeProbeSerializer(serializers.Serializer):
    url = serializers.URLField()
    reachable = serializers.BooleanField()


class _StacCollectionsSerializer(serializers.Serializer):
    base_models = serializers.BooleanField()
    datasets = serializers.BooleanField()
    local_models = serializers.BooleanField()


class HealthSerializer(serializers.Serializer):
    postgresql = serializers.BooleanField()
    s3 = serializers.BooleanField(required=False)
    stac_api = serializers.BooleanField(required=False)
    stac_collections = _StacCollectionsSerializer(required=False)
    zenml = serializers.BooleanField(required=False)
    mapswipe = _MapswipeProbeSerializer(required=False)


async def _probe_http(client: httpx.AsyncClient, url: str) -> bool:
    try:
        await client.get(url, follow_redirects=False)
    except httpx.HTTPError:
        return False
    return True


async def _probe_http_ok(client: httpx.AsyncClient, url: str) -> bool:
    """Returns True only on a 2xx response; False on any error or non-2xx status."""
    try:
        r = await client.get(url, follow_redirects=True)
        return r.is_success
    except httpx.HTTPError:
        return False


def _probe_postgres() -> bool:
    try:
        connections["default"].cursor()
    except OperationalError:
        return False
    return True


def _probe_s3() -> bool:
    if not settings.BUCKET_NAME:
        return False
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
        "stac_api, stac_collections (per-collection 2xx check), zenml. "
        "When ENABLE_MAPSWIPE=true the Mapswipe backend is probed too. "
        "Each probe runs concurrently via httpx + asyncio.gather."
    ),
)
@api_view(["GET"])
async def health(request) -> Response:
    payload: dict[str, object] = {}

    async with httpx.AsyncClient(timeout=_PROBE_TIMEOUT) as client:
        probes: dict[str, asyncio.Task] = {
            "postgresql": asyncio.create_task(sync_to_async(_probe_postgres)()),
        }
        if settings.BUCKET_NAME:
            probes["s3"] = asyncio.create_task(sync_to_async(_probe_s3)())
        if settings.FAIR_STAC_API_URL:
            probes["stac_api"] = asyncio.create_task(
                _probe_http(client, settings.FAIR_STAC_API_URL)
            )
            for collection_id in _STAC_COLLECTIONS:
                url = f"{settings.FAIR_STAC_API_URL}/collections/{collection_id}"
                probes[f"stac_col_{collection_id}"] = asyncio.create_task(
                    _probe_http_ok(client, url)
                )
        if settings.FAIR_ZENML_STORE_URL:
            probes["zenml"] = asyncio.create_task(
                _probe_http(client, settings.FAIR_ZENML_STORE_URL)
            )
        mapswipe_url = settings.MAPSWIPE_BACKEND_URL if settings.ENABLE_MAPSWIPE else None
        if mapswipe_url:
            probes["mapswipe_reachable"] = asyncio.create_task(_probe_http(client, mapswipe_url))

        results = await asyncio.gather(*probes.values())

    for name, result in zip(probes.keys(), results, strict=True):
        payload[name] = result

    if settings.FAIR_STAC_API_URL:
        # Fold per-collection results into a nested dict, keyed by slug
        # with hyphens replaced by underscores for JSON/schema consistency.
        payload["stac_collections"] = {
            col.replace("-", "_"): payload.pop(f"stac_col_{col}") for col in _STAC_COLLECTIONS
        }

    if mapswipe_url:
        payload["mapswipe"] = {
            "url": mapswipe_url,
            "reachable": payload.pop("mapswipe_reachable"),
        }

    return Response(payload)
