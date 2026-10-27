from django.db import transaction

from shared.exceptions import ResourceInUseException
from shared.integrations.stac import BASE_MODELS_COLLECTION, invalidate_stac_cache, item_exists
from shared.integrations.zenml import get_master_client

from .models import BaseModel


@transaction.atomic
def delete_base_model(base_model: BaseModel) -> None:
    """Delete the row, then the service and STAC versions; a failure there restores the row."""
    base_model = BaseModel.objects.select_for_update().get(pk=base_model.pk)
    if base_model.status == BaseModel.Status.REGISTERING:
        raise ResourceInUseException(f"{base_model.name} is still registering.")
    if base_model.local_models.exists():
        raise ResourceInUseException(f"{base_model.name} is the base of local models.")
    stac_item_id = str(base_model.stac_item_id)
    base_model.delete()
    if stac_item_id and item_exists(BASE_MODELS_COLLECTION, stac_item_id):
        get_master_client().delete_base_model(stac_item_id)
        invalidate_stac_cache(BASE_MODELS_COLLECTION, stac_item_id)
