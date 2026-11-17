import os
import tempfile
from functools import lru_cache
from pathlib import Path

from django.conf import settings
from fair.client import FairClient, UserScopedFairClient


@lru_cache(maxsize=1)
def _config_dir() -> Path:
    base = Path(tempfile.gettempdir()) / "fair-config"
    base.mkdir(parents=True, exist_ok=True)
    return base


@lru_cache(maxsize=1)
def get_master_client() -> FairClient:
    """Process-wide FairClient. setup() runs once per worker."""
    # Point fair's mirrored-asset hrefs at our presign proxy so they stay private but accessible.
    os.environ.setdefault("FAIR_S3_PUBLIC_URL", f"{settings.API_BASE_URL.rstrip('/')}/artifacts")
    client = FairClient(
        zenml_store_url=settings.FAIR_ZENML_STORE_URL,
        stac_api_url=settings.FAIR_STAC_API_URL,
        stac_api_key=settings.FAIR_STAC_API_KEY,
        dsn=settings.FAIR_STAC_DSN,
        user_id="fair-backend",
        config_dir=str(_config_dir()),
        upload_artifacts=True,
    )
    client.setup()
    return client


def reset_master_client() -> None:
    get_master_client.cache_clear()


def for_user(user_id: str) -> UserScopedFairClient:
    return get_master_client().with_user(user_id)
