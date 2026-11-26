"""Download user-supplied labels, GeoJSON or GeoParquet, from a public https URL."""

from pathlib import Path
from types import SimpleNamespace

import aiohttp
import fsspec
import yarl

from shared.public_urls import require_public_url

LABELS_URL_TIMEOUT_SECONDS = 120
LABELS_MAX_BYTES = 50 * 1024 * 1024
LABELS_PARQUET_MAX_BYTES = 100 * 1024 * 1024
LABELS_URL_MAX_REDIRECTS = 5
PARQUET_MAGIC = b"PAR1"


class LabelsSourceError(ValueError):
    pass


def labels_max_bytes(head: bytes) -> int:
    return LABELS_PARQUET_MAX_BYTES if head.startswith(PARQUET_MAGIC) else LABELS_MAX_BYTES


async def _check_redirect(
    session: aiohttp.ClientSession,
    context: SimpleNamespace,
    params: aiohttp.TraceRequestRedirectParams,
) -> None:
    location = params.response.headers.get("Location") or params.response.headers.get("URI")
    if location is None:
        raise LabelsSourceError("labels_url redirected without a Location header")
    require_public_url(str(params.response.url.join(yarl.URL(location))), ("https",))


class _SizeCap(fsspec.callbacks.Callback):
    def __init__(self, limit: int) -> None:
        super().__init__()
        self.limit = limit

    def call(self, *args: object, **kwargs: object) -> None:
        if max(self.value, self.size or 0) > self.limit:
            raise LabelsSourceError(f"labels_url is larger than {self.limit} bytes")


def download_labels(url: str, target: Path) -> None:
    """Download `url` to `target`, refusing private redirects, slow replies and oversized files."""
    require_public_url(url, ("https",))
    trace = aiohttp.TraceConfig()
    trace.on_request_redirect.append(_check_redirect)
    timeout = aiohttp.ClientTimeout(total=LABELS_URL_TIMEOUT_SECONDS)
    https = fsspec.filesystem(
        "https",
        client_kwargs={"trace_configs": [trace], "timeout": timeout},
        max_redirects=LABELS_URL_MAX_REDIRECTS + 1,  # aiohttp raises on reaching the limit
        skip_instance_cache=True,
    )
    largest = max(LABELS_PARQUET_MAX_BYTES, LABELS_MAX_BYTES)
    https.get_file(url, str(target), callback=_SizeCap(largest))
    with target.open("rb") as handle:
        limit = labels_max_bytes(handle.read(len(PARQUET_MAGIC)))
    if target.stat().st_size > limit:
        raise LabelsSourceError(f"labels_url is larger than {limit} bytes")
