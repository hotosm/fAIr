from datetime import UTC, datetime
from unittest.mock import patch

import pystac
import pytest
from django.core.cache.backends.db import DatabaseCache

from shared.integrations import stac
from shared.integrations.stac import BASE_MODELS_COLLECTION, get_cached_item


@pytest.mark.django_db
def test_a_cached_stac_item_is_readable_from_another_process() -> None:
    item = pystac.Item("dinov3s-buildings", None, None, datetime.now(UTC), {"title": "DINO Buildings"})
    with patch.object(stac, "_backend") as backend:
        backend.return_value.get_item.return_value = item
        get_cached_item(BASE_MODELS_COLLECTION, "dinov3s-buildings")

    other_process_cache = DatabaseCache("django_cache", {})
    cached = other_process_cache.get(f"stac:{BASE_MODELS_COLLECTION}:dinov3s-buildings")

    assert cached is not None
    assert cached["properties"]["title"] == "DINO Buildings"
