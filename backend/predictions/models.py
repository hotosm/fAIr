from django.db import models
from django.db.models import OuterRef, Subquery
from django.db.models.functions import Coalesce

from accounts.models import OsmUser
from modelregistry.models import BaseModel, LocalModel
from shared.enums import PipelineRunStatus, Visibility


def _model_category(model: type[BaseModel] | type[LocalModel]) -> Subquery:
    rows = model.objects.filter(stac_item_id=OuterRef("local_model_stac_id"))
    return Subquery(rows.values("category_id")[:1])


class PredictionQuerySet(models.QuerySet):
    def with_category(self) -> "PredictionQuerySet":
        """Local model wins when both registries hold the stac id."""
        category = Coalesce(_model_category(LocalModel), _model_category(BaseModel))
        return self.annotate(category=category)


class Prediction(models.Model):
    zenml_run_id = models.CharField(max_length=64, unique=True, null=True, blank=True)
    local_model_stac_id = models.CharField(max_length=64)
    image_uri = models.URLField()
    geometry = models.JSONField()
    zoom = models.PositiveSmallIntegerField()
    params = models.JSONField(default=dict, blank=True)
    remove_osm = models.BooleanField(default=False)
    visibility = models.CharField(
        max_length=20, choices=Visibility.choices, default=Visibility.PRIVATE, db_index=True
    )
    description = models.TextField(blank=True)
    status = models.CharField(
        max_length=20,
        choices=PipelineRunStatus.choices,
        default=PipelineRunStatus.INITIALIZING,
    )
    results_ready = models.BooleanField(default=False)
    mapswipe_project_id = models.CharField(max_length=100, blank=True)
    user = models.ForeignKey(
        OsmUser,
        to_field="osm_id",
        on_delete=models.CASCADE,
        related_name="predictions",
    )
    submitted_at = models.DateTimeField(auto_now_add=True)
    last_polled_at = models.DateTimeField(null=True, blank=True)

    objects = PredictionQuerySet.as_manager()

    class Meta:
        indexes = [
            models.Index(fields=["local_model_stac_id"]),
            models.Index(fields=["status"]),
            models.Index(fields=["user"]),
        ]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(status__in=PipelineRunStatus.values),
                name="prediction_status_valid",
            ),
            models.CheckConstraint(
                condition=models.Q(visibility__in=Visibility.values),
                name="prediction_visibility_valid",
            ),
        ]
        ordering = ["-submitted_at"]
