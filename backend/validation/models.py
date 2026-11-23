from django.contrib.postgres.fields import ArrayField
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from accounts.models import OsmUser
from shared.enums import ValidationBuildStatus, ValidationStatus, ValidationType


class ValidationProject(models.Model):
    Type = ValidationType
    Status = ValidationStatus
    BuildStatus = ValidationBuildStatus

    source_ids = ArrayField(
        models.CharField(max_length=200),
        default=list,
        help_text="Dataset STAC ids on the same imagery, or the one prediction id.",
    )
    type = models.CharField(max_length=10, choices=ValidationType.choices)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    answers_needed = models.PositiveSmallIntegerField(
        default=1, validators=[MinValueValidator(1), MaxValueValidator(9)]
    )
    status = models.CharField(
        max_length=10, choices=ValidationStatus.choices, default=ValidationStatus.DRAFT
    )
    build_status = models.CharField(
        max_length=10, choices=ValidationBuildStatus.choices, default=ValidationBuildStatus.BUILDING
    )
    build_error = models.TextField(blank=True)
    build_requested_at = models.DateTimeField(null=True, blank=True)
    user = models.ForeignKey(
        OsmUser, to_field="osm_id", on_delete=models.CASCADE, related_name="validation_projects"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [models.Index(fields=["status"])]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(type__in=ValidationType.values), name="validation_type_valid"
            ),
            models.CheckConstraint(
                condition=models.Q(status__in=ValidationStatus.values),
                name="validation_status_valid",
            ),
            models.CheckConstraint(
                condition=models.Q(build_status__in=ValidationBuildStatus.values),
                name="validation_build_status_valid",
            ),
        ]
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return self.title


class ValidationAnswer(models.Model):
    project = models.ForeignKey(ValidationProject, on_delete=models.CASCADE, related_name="answers")
    tile_id = models.BigIntegerField(help_text="PMTiles tile id of the answered tile.")
    respondent = models.CharField(max_length=64, help_text="u:<osm id> or g:<device id>.")
    valid = models.BooleanField()
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["project", "tile_id", "respondent"],
                name="one_answer_per_respondent",
            )
        ]
