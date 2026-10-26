"""Fetch a user-supplied labels GeoJSON from a public https URL."""

import json
import time
from typing import Any

import httpx

from shared.public_urls import require_public_url

LABELS_URL_TIMEOUT = httpx.Timeout(30.0)
LABELS_URL_TOTAL_SECONDS = 120
LABELS_URL_MAX_BYTES = 50 * 1024 * 1024


class LabelsSourceError(ValueError):
    pass


def fetch_labels_geojson(url: str) -> dict[str, Any]:
    """Download and parse a FeatureCollection; fails on non-public hosts, non-200 status (redirects
    included), bodies over LABELS_URL_MAX_BYTES and downloads past LABELS_URL_TOTAL_SECONDS."""
    require_public_url(url, ("https",))

    body = bytearray()
    deadline = time.monotonic() + LABELS_URL_TOTAL_SECONDS
    with httpx.stream("GET", url, timeout=LABELS_URL_TIMEOUT, follow_redirects=False) as response:
        if response.status_code != httpx.codes.OK:
            raise LabelsSourceError(f"labels_url returned HTTP {response.status_code}")
        for chunk in response.iter_bytes():
            if time.monotonic() > deadline:
                raise LabelsSourceError(
                    f"labels_url took longer than {LABELS_URL_TOTAL_SECONDS} s to download"
                )
            body.extend(chunk)
            if len(body) > LABELS_URL_MAX_BYTES:
                raise LabelsSourceError(f"labels_url is larger than {LABELS_URL_MAX_BYTES} bytes")

    collection = json.loads(body)
    if (
        not isinstance(collection, dict)
        or collection.get("type") != "FeatureCollection"
        or not isinstance(collection.get("features"), list)
    ):
        raise LabelsSourceError("labels_url must point to a GeoJSON FeatureCollection")
    return collection
