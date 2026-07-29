import json
import logging
import tempfile
from pathlib import Path

from django_tasks import task

from shared.integrations.stac import BASE_MODELS_COLLECTION, invalidate_stac_cache
from shared.integrations.zenml import for_user

from .models import BaseModel

logger = logging.getLogger(__name__)


@task()
def register_base_model(*, base_model_id: int, stac_item: dict) -> None:
    """Register the given STAC item via fair-py-ops and flip the row's status.

    The item is passed in (not stored on the row) so STAC stays the sole home
    for it. Runs off-request because registration mirrors the model weights from
    the source URLs into the artifact store, which can take minutes.
    """
    # TODO: make fair-py-ops verify the inference URL from the STAC item instead
    # of ensure_knative_service creating cluster resources on the prod path.
    base_model = BaseModel.objects.get(id=base_model_id)
    handle, item_path = tempfile.mkstemp(suffix=".json")
    try:
        if not stac_item:
            raise ValueError("no stac_item supplied to register")
        with open(handle, "w") as fh:
            json.dump(stac_item, fh)
        published_id = for_user(str(base_model.user.osm_id)).register_base_model(item_path)
        base_model.stac_item_id = published_id
        base_model.status = BaseModel.Status.ACTIVE
        base_model.error = ""
        base_model.save(update_fields=["stac_item_id", "status", "error", "last_modified"])
        invalidate_stac_cache(BASE_MODELS_COLLECTION, base_model.name)
    except Exception as exc:
        logger.exception("base model registration failed for %s", base_model_id)
        base_model.status = BaseModel.Status.FAILED
        base_model.error = str(exc)[:2000]
        base_model.save(update_fields=["status", "error", "last_modified"])
        raise
    finally:
        Path(item_path).unlink(missing_ok=True)
