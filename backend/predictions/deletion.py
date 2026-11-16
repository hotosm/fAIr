from django.db import transaction
from fair.zenml.runs import is_terminal

from shared.exceptions import ResourceInUseException
from shared.storage import StoragePaths, remove_dir

from .models import Prediction


@transaction.atomic
def delete_prediction(prediction: Prediction) -> None:
    """Delete the row, then its input chips and outputs; a storage failure restores the row."""
    prediction = Prediction.objects.select_for_update().get(pk=prediction.pk)
    if not is_terminal(prediction.status):
        raise ResourceInUseException(f"Prediction {prediction.id} is still running.")
    prediction_id = prediction.id
    prediction.delete()
    remove_dir(StoragePaths.prediction_dir_uri(prediction_id))
