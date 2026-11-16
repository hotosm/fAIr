"""Read a user-supplied labels GeoJSON from a public https URL or an upload."""

import json
import time
from typing import Any

import httpx

from shared.public_urls import require_public_url

LABELS_URL_TIMEOUT = httpx.Timeout(30.0)
LABELS_URL_TOTAL_SECONDS = 120
LABELS_MAX_BYTES = 50 * 1024 * 1024
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
                if len(body) > LABELS_MAX_BYTES:
                    raise LabelsSourceError(f"labels_url is larger than {LABELS_MAX_BYTES} bytes")
            return bytes(body)
    raise LabelsSourceError(f"labels_url redirected more than {LABELS_URL_MAX_REDIRECTS} times")


def parse_labels_geojson(body: bytes) -> dict[str, Any]:
    """The FeatureCollection in `body`; fails on invalid JSON or any other GeoJSON type."""
    try:
        collection = json.loads(body)
    except (json.JSONDecodeError, UnicodeDecodeError, RecursionError) as exc:
        raise LabelsSourceError(f"labels are not valid JSON: {exc}") from exc
    if (
        not isinstance(collection, dict)
        or collection.get("type") != "FeatureCollection"
        or not isinstance(collection.get("features"), list)
    ):
        raise LabelsSourceError("labels must be a GeoJSON FeatureCollection")
    return collection


def fetch_labels_geojson(url: str) -> dict[str, Any]:
    """Download and parse a FeatureCollection, within the public-host, size and time limits."""
    return parse_labels_geojson(_download(url))
