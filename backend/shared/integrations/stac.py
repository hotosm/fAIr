"""STAC catalog access for the fAIr backend.

Wraps fair-py-ops' backend Protocol with a Django LocMem cache layer and
helpers used by the API serializers and pin/unpin actions. Property mutations
read-modify-write the item (``get_item`` then ``publish_item``/PUT) because the
STAC API does not accept HTTP PATCH; ``set_item_property`` is the single-key
convenience wrapper.
"""

import tempfile
from concurrent.futures import ThreadPoolExecutor

import httpx
import pystac
from django.conf import settings
from django.core.cache import cache
from fair.stac.constants import (
    BASE_MODELS_COLLECTION,
    DATASETS_COLLECTION,
    LOCAL_MODELS_COLLECTION,
)

from .zenml import get_master_client

__all__ = [
    "BASE_MODELS_COLLECTION",
    "DATASETS_COLLECTION",
    "FAIR_CATEGORY_PROPERTY",
    "FAIR_PINNED_PROPERTY",
    "FAIR_PREVIEW_LOCATION_PROPERTY",
    "FAIR_SOURCE_IMAGERY_PROPERTY",
    "LOCAL_MODELS_COLLECTION",
    "bulk_get_cached_items",
    "deprecate_item",
    "get_active_local_model_item",
    "get_base_model",
    "get_cached_item",
    "get_dataset",
    "get_local_model",
    "invalidate_stac_cache",
    "item_exists",
    "list_base_models",
    "list_datasets",
    "list_local_models",
    "mirror_and_relink_assets",
    "serialize_item",
    "set_item_properties",
    "set_item_property",
]

# Assets whose bytes we mirror into our own bucket so the public STAC item can
# link to a stable, presign-backed download instead of the internal store.
DOWNLOADABLE_STAC_ASSETS = ("model", "checkpoint", "training-metrics", "download")
_ASSET_MIRROR_TIMEOUT_S = 900

FAIR_PINNED_PROPERTY = "fair:pinned"
FAIR_SOURCE_IMAGERY_PROPERTY = "fair:source_imagery"
FAIR_PREVIEW_LOCATION_PROPERTY = "fair:preview_location"
FAIR_CATEGORY_PROPERTY = "fair:category"

_CACHE_TTL_SECONDS = settings.STAC_CACHE_TTL
_BULK_FETCH_MAX_WORKERS = settings.STAC_BULK_FETCH_WORKERS


def _backend():
    return get_master_client()._get_backend()


def get_base_model(item_id: str) -> pystac.Item:
    return _backend().get_item(BASE_MODELS_COLLECTION, item_id)


def get_dataset(item_id: str) -> pystac.Item:
    return _backend().get_item(DATASETS_COLLECTION, item_id)


def get_local_model(item_id: str) -> pystac.Item:
    return _backend().get_item(LOCAL_MODELS_COLLECTION, item_id)


def list_base_models(*, limit: int | None = None) -> list[pystac.Item]:
    return _backend().list_items(BASE_MODELS_COLLECTION, limit=limit)


def list_datasets(*, limit: int | None = None) -> list[pystac.Item]:
    return _backend().list_items(DATASETS_COLLECTION, limit=limit)


def list_local_models(*, limit: int | None = None) -> list[pystac.Item]:
    return _backend().list_items(LOCAL_MODELS_COLLECTION, limit=limit)


def item_exists(collection_id: str, item_id: str) -> bool:
    return _backend().item_exists(collection_id, item_id)


def deprecate_item(collection_id: str, item_id: str) -> pystac.Item:
    invalidate_stac_cache(collection_id, item_id)
    return _backend().deprecate_item(collection_id, item_id)


def serialize_item(item: pystac.Item) -> dict:
    """JSON-safe extract of the STAC fields the API exposes.

    Narrow on purpose: cards/detail need description, datetime, geometry,
    assets, properties, links. Anything else stays inside the raw STAC item
    and is not surfaced through the backend.
    """
    raw = item.to_dict(include_self_link=False, transform_hrefs=False)
    properties = raw.get("properties") or {}
    return {
        "description": properties.get("description"),
        "datetime": properties.get("datetime"),
        "geometry": raw.get("geometry"),
        "assets": raw.get("assets") or {},
        "properties": properties,
        "links": raw.get("links") or [],
    }


def _cache_key(collection_id: str, item_id: str) -> str:
    return f"stac:{collection_id}:{item_id}"


def get_cached_item(collection_id: str, item_id: str) -> dict:
    """Fetch a STAC item through the LocMem cache. Raises on STAC error."""
    key = _cache_key(collection_id, item_id)
    hit = cache.get(key)
    if hit is not None:
        return hit
    payload = serialize_item(_backend().get_item(collection_id, item_id))
    cache.set(key, payload, _CACHE_TTL_SECONDS)
    return payload


def bulk_get_cached_items(
    pairs: list[tuple[str, str]],
) -> dict[tuple[str, str], dict]:
    """Parallel cold-fetch for a page of items. Cached entries skip the network.

    Raises if any backing STAC fetch fails (consistent with fail-loud).
    """
    if not pairs:
        return {}

    keys = [_cache_key(c, i) for c, i in pairs]
    cached = cache.get_many(keys)
    result: dict[tuple[str, str], dict] = {}
    misses: list[tuple[str, str]] = []
    for (collection_id, item_id), key in zip(pairs, keys, strict=True):
        if key in cached:
            result[(collection_id, item_id)] = cached[key]
        else:
            misses.append((collection_id, item_id))

    if misses:
        with ThreadPoolExecutor(max_workers=min(_BULK_FETCH_MAX_WORKERS, len(misses))) as pool:
            fetched = list(pool.map(lambda p: (p, serialize_item(_backend().get_item(*p))), misses))
        to_set = {_cache_key(c, i): payload for (c, i), payload in fetched}
        cache.set_many(to_set, _CACHE_TTL_SECONDS)
        for (collection_id, item_id), payload in fetched:
            result[(collection_id, item_id)] = payload

    return result


def invalidate_stac_cache(collection_id: str, item_id: str) -> None:
    cache.delete(_cache_key(collection_id, item_id))


def get_active_local_model_item(model_name: str) -> pystac.Item | None:
    # STAC items are keyed by version UUID; callers that hold the slug
    # (LocalModel.name == mlm:name) need this lookup before writing
    # per-version properties.
    # TODO(stac-cql2): linear scan via list_items. Plumb a CQL2 search through
    # the StacBackend protocol once it's needed at scale.
    for item in _backend().list_items(LOCAL_MODELS_COLLECTION):
        if item.properties.get("mlm:name") != model_name:
            continue
        if item.properties.get("deprecated"):
            continue
        return item
    return None


def set_item_property(collection_id: str, item_id: str, key: str, value: object) -> dict:
    # Single-key convenience wrapper over the read-modify-write below.
    return set_item_properties(collection_id, item_id, {key: value})


def set_item_properties(collection_id: str, item_id: str, properties: dict) -> dict:
    # Read-modify-write: the STAC API rejects PATCH, so merge onto the current
    # item and PUT it back via publish_item. Refreshes the cache.
    backend = _backend()
    item = backend.get_item(collection_id, item_id)
    item.properties.update(properties)
    published = backend.publish_item(collection_id, item)
    payload = serialize_item(published)
    cache.set(_cache_key(collection_id, item_id), payload, _CACHE_TTL_SECONDS)
    return payload


def _stream_href_to_bucket(source_href: str, prefix: str) -> None:
    # Copy the object at `source_href` (readable internal store URL) into our
    # bucket under `prefix`, preserving its filename. Streams via a temp file so
    # large weights never sit in memory.
    filename = source_href.rsplit("/", 1)[-1].split("?", 1)[0] or "asset"
    key = f"{prefix}{filename}"
    with (
        httpx.stream(
            "GET", source_href, timeout=_ASSET_MIRROR_TIMEOUT_S, follow_redirects=True
        ) as response,
        tempfile.NamedTemporaryFile() as tmp,
    ):
        response.raise_for_status()
        for chunk in response.iter_bytes(chunk_size=1 << 20):
            tmp.write(chunk)
        tmp.flush()
        settings.S3_CLIENT.upload_file(tmp.name, settings.BUCKET_NAME, key)


def mirror_and_relink_assets(collection_id: str, item_id: str) -> None:
    """Mirror an item's downloadable assets into our bucket and repoint their
    hrefs at the presign-redirect endpoint, so public STAC links stay
    downloadable while the objects stay private. Idempotent."""
    from shared.storage import StoragePaths

    backend = _backend()
    item = backend.get_item(collection_id, item_id)
    base = settings.API_BASE_URL.rstrip("/")
    changed = False
    for name in DOWNLOADABLE_STAC_ASSETS:
        asset = item.assets.get(name)
        if asset is None or not asset.href:
            continue
        if (
            "/stac-assets/" in asset.href or "/artifacts/" in asset.href
        ):  # this is poor choice , TODO : Change this to check the fair proxy itself
            continue
        prefix = StoragePaths.stac_download_prefix(collection_id, item_id, name)
        _stream_href_to_bucket(asset.href, prefix)
        asset.href = f"{base}/stac-assets/{collection_id}/{item_id}/{name}/"
        changed = True
    if changed:
        backend.publish_item(collection_id, item)
        invalidate_stac_cache(collection_id, item_id)
