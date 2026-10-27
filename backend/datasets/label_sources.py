"""Fetch a user-supplied labels GeoJSON from a public https URL."""

import json
import time
from typing import Any

import httpx

from shared.public_urls import require_public_url

LABELS_URL_TIMEOUT = httpx.Timeout(30.0)
LABELS_URL_TOTAL_SECONDS = 120
LABELS_URL_MAX_BYTES = 50 * 1024 * 1024
LABELS_URL_MAX_REDIRECTS = 5


class LabelsSourceError(ValueError):
    pass


def _download(url: str) -> bytes:
    """Every hop, redirects included, must pass the public https check before it is requested.

    httpx's own redirect handling reads each redirect body in full, outside the size cap."""
    body = bytearray()
    deadline = time.monotonic() + LABELS_URL_TOTAL_SECONDS
    for _ in range(LABELS_URL_MAX_REDIRECTS + 1):
        require_public_url(url, ("https",))
        with httpx.stream(
            "GET", url, timeout=LABELS_URL_TIMEOUT, follow_redirects=False
        ) as response:
            if response.next_request is not None:
                url = str(response.next_request.url)
                continue
            if response.status_code != httpx.codes.OK:
                raise LabelsSourceError(f"labels_url returned HTTP {response.status_code}")
            for chunk in response.iter_bytes():
                if time.monotonic() > deadline:
                    raise LabelsSourceError(
                        f"labels_url took longer than {LABELS_URL_TOTAL_SECONDS} s to download"
                    )
                body.extend(chunk)
                if len(body) > LABELS_URL_MAX_BYTES:
                    raise LabelsSourceError(
                        f"labels_url is larger than {LABELS_URL_MAX_BYTES} bytes"
                    )
            return bytes(body)
    raise LabelsSourceError(f"labels_url redirected more than {LABELS_URL_MAX_REDIRECTS} times")


def fetch_labels_geojson(url: str) -> dict[str, Any]:
    """Download and parse a FeatureCollection; fails on non-public hosts at any hop, non-200 status,
    bodies over LABELS_URL_MAX_BYTES and downloads past LABELS_URL_TOTAL_SECONDS."""
    body = _download(url)
    collection = json.loads(body)
    if (
        not isinstance(collection, dict)
        or collection.get("type") != "FeatureCollection"
        or not isinstance(collection.get("features"), list)
    ):
        raise LabelsSourceError("labels_url must point to a GeoJSON FeatureCollection")
    return collection
