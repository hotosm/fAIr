from django.db import transaction

from shared.exceptions import ResourceInUseException
from shared.integrations.stac import DATASETS_COLLECTION, invalidate_stac_cache, item_exists
from shared.integrations.zenml import get_master_client

from .models import Dataset


@transaction.atomic
def delete_dataset(dataset: Dataset) -> None:
    """Delete the row, then the STAC versions; a failure there restores the row."""
    dataset = Dataset.objects.select_for_update().get(pk=dataset.pk)
    if dataset.status == Dataset.Status.BUILDING:
        raise ResourceInUseException(f"{dataset.title} is still building.")
    if dataset.training_runs.exists():
        raise ResourceInUseException(f"{dataset.title} has training runs.")
    stac_id = str(dataset.stac_id)
    dataset.delete()
    if item_exists(DATASETS_COLLECTION, stac_id):
        get_master_client().delete_dataset(stac_id)
        invalidate_stac_cache(DATASETS_COLLECTION, stac_id)
