from django.db import models

from accounts.models import OsmUser
from shared.enums import (
    BaseModelCategory,
    BaseModelStatus,
    LocalModelStatus,
    Visibility,
)


class LocalModel(models.Model):
    # `name` is the chain key (= ZenML model_name = STAC mlm:name on every
    # version), NOT a STAC item id. A LocalModel is the family; each promote
    # creates a new STAC item under the same `mlm:name`. Per-version metadata
    # (title, description, assets) lives in STAC.

    # Module-level enum: a nested class body cannot see it from inside Meta.
    Status = LocalModelStatus

    name = models.CharField(max_length=200, unique=True)
    status = models.CharField(
        max_length=20, choices=LocalModelStatus.choices, default=LocalModelStatus.ACTIVE
    )
    visibility = models.CharField(
        max_length=20, choices=Visibility.choices, default=Visibility.PRIVATE, db_index=True
    )
    user = models.ForeignKey(
        OsmUser,
        to_field="osm_id",
        on_delete=models.CASCADE,
        related_name="local_models",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    last_modified = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["user"]),
        ]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(status__in=LocalModelStatus.values),
                name="localmodel_status_valid",
            ),
            models.CheckConstraint(
                condition=models.Q(visibility__in=Visibility.values),
                name="localmodel_visibility_valid",
            ),
        ]
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return self.name


class BaseModel(models.Model):
    Status = BaseModelStatus
    Category = BaseModelCategory

    name = models.CharField(max_length=200, unique=True)
    category = models.CharField(
        max_length=50,
        choices=BaseModelCategory.choices,
        default=BaseModelCategory.OTHER,
        db_index=True,
    )
    status = models.CharField(
        max_length=20,
        choices=BaseModelStatus.choices,
        default=BaseModelStatus.REGISTERING,
    )
    visibility = models.CharField(
        max_length=20, choices=Visibility.choices, default=Visibility.PUBLIC, db_index=True
    )
    stac_item = models.JSONField(default=dict, blank=True)
    error = models.TextField(blank=True, default="")
    user = models.ForeignKey(
        OsmUser,
        to_field="osm_id",
        on_delete=models.CASCADE,
        related_name="base_models",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    last_modified = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["user"]),
        ]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(status__in=BaseModelStatus.values),
                name="basemodel_status_valid",
            ),
            models.CheckConstraint(
                condition=models.Q(visibility__in=Visibility.values),
                name="basemodel_visibility_valid",
            ),
        ]
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return self.name
