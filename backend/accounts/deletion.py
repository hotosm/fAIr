from django.db import transaction
from django.db.models import Q
from fair.zenml.runs import is_terminal

from datasets.deletion import delete_dataset
from datasets.models import AOI, Dataset
from modelregistry.models import BaseModel, LocalModel
from predictions.deletion import delete_prediction
from predictions.models import Prediction
from shared.enums import Visibility
from shared.exceptions import ResourceInUseException
from trainings.models import TrainingRunRef

from .models import OsmUser

DELETED_USER_OSM_ID = 0


def has_work_in_progress(user: OsmUser) -> bool:
    runs = [*Prediction.objects.filter(user=user), *TrainingRunRef.objects.filter(user=user)]
    building = Dataset.objects.filter(user=user, status=Dataset.Status.BUILDING).exists()
    return building or any(not is_terminal(run.status) for run in runs)


@transaction.atomic
def delete_account(user: OsmUser) -> None:
    """Delete private records and files; move public ones to the Deleted user account."""
    if user.osm_id == DELETED_USER_OSM_ID:
        raise ResourceInUseException("The Deleted user account holds reassigned records.")
    if has_work_in_progress(user):
        raise ResourceInUseException(f"{user.username} has a dataset build or run in progress.")

    public = Q(visibility=Visibility.PUBLIC)
    for prediction in Prediction.objects.filter(user=user).exclude(public):
        delete_prediction(prediction)
    LocalModel.objects.filter(user=user, stac_item_id="").delete()
    for dataset in Dataset.objects.filter(user=user, training_runs=None).exclude(public):
        delete_dataset(dataset)

    deleted_user, _ = OsmUser.objects.get_or_create(
        osm_id=DELETED_USER_OSM_ID, defaults={"username": "Deleted user"}
    )
    kept = [Prediction, LocalModel, TrainingRunRef, Dataset, BaseModel]
    for model in kept:
        model.objects.filter(user=user).update(user=deleted_user)
    AOI.objects.filter(user=user, dataset__isnull=False).update(user=deleted_user)
    user.delete()
