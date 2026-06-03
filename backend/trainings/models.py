from django.db import models

from accounts.models import OsmUser
from datasets.models import Dataset
from modelregistry.models import LocalModel


class TrainingRunRef(models.Model):
    zenml_run_id = models.CharField(max_length=64, unique=True, null=True, blank=True)
    local_model = models.ForeignKey(
        LocalModel,
        on_delete=models.CASCADE,
        related_name="runs",
    )
    base_model_stac_id = models.CharField(max_length=200)
    dataset = models.ForeignKey(
        Dataset,
        on_delete=models.PROTECT,
        related_name="training_runs",
        null=True,
        blank=True,
    )
    overrides = models.JSONField(default=dict, blank=True)
    title = models.CharField(max_length=200, blank=True, default="")
    # keywords + dataset keywords + dataset fair:geometry_type) at publish.
    keywords = models.JSONField(default=list, blank=True)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, default="initializing")
    user = models.ForeignKey(
        OsmUser,
        to_field="osm_id",
        on_delete=models.CASCADE,
        related_name="training_runs",
    )
    submitted_at = models.DateTimeField(auto_now_add=True)
    last_polled_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["local_model"]),
            models.Index(fields=["status"]),
            models.Index(fields=["user"]),
            models.Index(fields=["base_model_stac_id"]),
        ]
        ordering = ["-submitted_at"]
