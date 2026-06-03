from django.contrib.gis.db import models as geomodels
from django.db import models, transaction

from accounts.models import OsmUser
from shared.enums import Visibility
from shared.validators import validate_geometry


class Dataset(models.Model):
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        BUILDING = "building", "Building"
        BUILT = "built", "Built"
        FAILED = "failed", "Failed"

    stac_id = models.CharField(max_length=200, unique=True)
    title = models.CharField(max_length=200)
    source_imagery = models.URLField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    visibility = models.CharField(
        max_length=20, choices=Visibility.choices, default=Visibility.PRIVATE, db_index=True
    )
    user = models.ForeignKey(
        OsmUser, to_field="osm_id", on_delete=models.CASCADE, related_name="datasets"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    last_modified = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["user"]),
        ]
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.title} ({self.stac_id})"


class AOI(models.Model):
    dataset = models.ForeignKey(
        Dataset, on_delete=models.CASCADE, related_name="aois", null=True, blank=True
    )
    geom = geomodels.PolygonField(srid=4326)
    user = models.ForeignKey(
        OsmUser, to_field="osm_id", on_delete=models.CASCADE, related_name="aois"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    last_modified = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["dataset"]),
            models.Index(fields=["geom"], name="aoi_geom_gist_idx", opclasses=["gist"]),
        ]

    @transaction.atomic
    def clean(self) -> None:
        if self.geom:
            self.geom = validate_geometry(self.geom)
