import json
import logging
import tempfile
from pathlib import Path

from django.conf import settings
from django_tasks import task

from shared.integrations.stac import (
    BASE_MODELS_COLLECTION,
    invalidate_stac_cache,
    mirror_and_relink_assets,
)
from shared.integrations.zenml import for_user

from .models import BaseModel

logger = logging.getLogger(__name__)

_INFRA_ERROR_TYPE_NAMES = frozenset(
    {
        "MaxRetryError",
        "ConnectTimeoutError",
        "ReadTimeoutError",
        "ApiException",
    }
)


def _is_infra_error(exc: BaseException) -> bool:
    """True when the failure is a connectivity timeout reaching the Kubernetes API
    (the knative-install check), not a caller or model problem such as a bad weights
    URL. Walks the ``__cause__`` / ``__context__`` chain so a wrapped timeout is still
    caught, and matches timeout types only so a user's connection error is not blamed
    on infrastructure."""
    seen: set[int] = set()
    current: BaseException | None = exc
    while current is not None and id(current) not in seen:
        seen.add(id(current))
        if isinstance(current, TimeoutError):
            return True
        if type(current).__name__ in _INFRA_ERROR_TYPE_NAMES:
            return True
        current = current.__cause__ or current.__context__
    return False


@task()
def mirror_stac_assets_task(*, collection_id: str, item_id: str) -> None:
    """Mirror a published item's downloadable assets into our bucket and repoint
    their hrefs at the presign endpoint. Enqueued after every publish so public
    STAC links stay downloadable without blocking the publish request."""
    mirror_and_relink_assets(collection_id, item_id)


@task()
def register_base_model(*, base_model_id: int, stac_item: dict) -> None:
    """Register the given STAC item via fair-py-ops and flip the row's status.

    The item is passed in (not stored on the row) so STAC stays the sole home
    for it. Runs off-request because registration mirrors the model weights from
    the source URLs into the artifact store, which can take minutes.
    """
    base_model = BaseModel.objects.get(id=base_model_id)
    handle, item_path = tempfile.mkstemp(suffix=".json")
    try:
        if not stac_item:
            raise ValueError("no stac_item supplied to register")
        with open(handle, "w") as fh:
            json.dump(stac_item, fh)
        published_id = for_user(str(base_model.user.osm_id)).register_base_model(
            item_path, knative_template=settings.KNATIVE_SERVICE_TEMPLATE
        )
        base_model.stac_item_id = published_id
        base_model.status = BaseModel.Status.ACTIVE
        base_model.error = ""
        base_model.save(update_fields=["stac_item_id", "status", "error", "last_modified"])
        invalidate_stac_cache(BASE_MODELS_COLLECTION, base_model.name)
        mirror_stac_assets_task.enqueue(collection_id=BASE_MODELS_COLLECTION, item_id=published_id)
    except Exception as exc:
        if _is_infra_error(exc):
            message = (
                "Could not reach the inference cluster (Kubernetes/Knative). This is an "
                "infrastructure problem, not an issue with the submitted model; retry "
                "registration once the cluster is reachable."
            )
            logger.error(
                "base model registration hit an infrastructure error for %s: %s",
                base_model_id,
                exc,
            )
        else:
            message = str(exc)
            logger.exception("base model registration failed for %s", base_model_id)
        base_model.status = BaseModel.Status.FAILED
        base_model.error = message[:2000]
        base_model.save(update_fields=["status", "error", "last_modified"])
        raise
    finally:
        Path(item_path).unlink(missing_ok=True)
