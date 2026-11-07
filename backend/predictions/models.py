from django.db import models
from django.db.models import OuterRef, Subquery
from django.db.models.functions import Coalesce

from accounts.models import OsmUser
from modelregistry.models import BaseModel, LocalModel
from shared.enums import PipelineRunStatus, Visibility
from shared.imagery import InputImagery


def _model_field(model: type[BaseModel] | type[LocalModel], field: str) -> Subquery:
    rows = model.objects.filter(stac_item_id=OuterRef("local_model_stac_id"))
    return Subquery(rows.values(field)[:1])


def _registered_model_field(field: str) -> Coalesce:
    """Local model wins when both registries hold the stac id."""
    return Coalesce(_model_field(LocalModel, field), _model_field(BaseModel, field))


class PredictionQuerySet(models.QuerySet):
    def with_model_details(self) -> "PredictionQuerySet":
        return self.annotate(
            category=_registered_model_field("category_id"),
            model_name=_registered_model_field("name"),
        )


class Prediction(InputImagery):
    zenml_run_id = models.CharField(max_length=64, unique=True, null=True, blank=True)
    local_model_stac_id = models.CharField(max_length=64)
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
    error = models.TextField(
        blank=True, help_text="Why the run failed; empty unless status is failed."
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
