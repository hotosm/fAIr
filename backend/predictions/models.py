from django.db import models
from django.db.models import OuterRef, Subquery
from django.db.models.functions import Coalesce

from accounts.models import OsmUser
from modelregistry.models import BaseModel, LocalModel
from shared.enums import PipelineRunStatus, Visibility
from shared.imagery import InputImagery
from shared.run_status import is_terminal


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
        )


class Prediction(InputImagery):
    zenml_run_id = models.CharField(max_length=64, unique=True, null=True, blank=True)
    local_model_stac_id = models.CharField(max_length=64)
    # Stable across a local model's versions, whose STAC item ids differ.
    model_name = models.CharField(max_length=200, blank=True, default="", db_index=True)
    geometry = models.JSONField()
    zoom = models.PositiveSmallIntegerField()
    params = models.JSONField(default=dict, blank=True)
    visibility = models.CharField(
        max_length=20, choices=Visibility.choices, default=Visibility.PRIVATE, db_index=True
    )
    description = models.TextField(blank=True)
    status = models.CharField(
        max_length=20,
        choices=PipelineRunStatus.choices,
        default=PipelineRunStatus.SUBMITTED,
    )
    error = models.TextField(
        blank=True, help_text="Why the run failed; empty unless status is failed."
    )
    results_ready = models.BooleanField(default=False)
    post_run_attempts = models.PositiveSmallIntegerField(default=0)
    feature_count = models.PositiveIntegerField(
        null=True, blank=True, help_text="Features in the result; null until it is counted."
    )
    user = models.ForeignKey(
        OsmUser,
        to_field="osm_id",
        on_delete=models.CASCADE,
        related_name="predictions",
    )
    submitted_at = models.DateTimeField(auto_now_add=True)
    last_polled_at = models.DateTimeField(null=True, blank=True)

    objects = PredictionQuerySet.as_manager()

    @property
    def is_finished(self) -> bool:
        """The run is over and, if it completed, its outputs are written."""
        completed = self.status == PipelineRunStatus.COMPLETED
        return is_terminal(self.status) and (self.results_ready or not completed)

    class Meta:
        indexes = [
            models.Index(fields=["local_model_stac_id"]),
            models.Index(fields=["status"]),
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
