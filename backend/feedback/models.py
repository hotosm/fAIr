from django.contrib.gis.db import models as geomodels
from django.db import models

from accounts.models import OsmUser
from shared.validators import validate_geometry


class Feedback(models.Model):
    class Action(models.TextChoices):
        ACCEPT = "accept", "Accept"
        REJECT = "reject", "Reject"

    stac_id = models.CharField(max_length=200, db_index=True)
    geom = geomodels.GeometryField(srid=4326)
    action = models.CharField(max_length=6, choices=Action.choices, default=Action.ACCEPT)
    comments = models.TextField(blank=True)
    config = models.JSONField(default=dict, blank=True)
    user = models.ForeignKey(
        OsmUser,
        to_field="osm_id",
        on_delete=models.CASCADE,
        related_name="feedback",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["stac_id"]),
            models.Index(fields=["user"]),
            models.Index(fields=["action"]),
            models.Index(fields=["geom"], name="feedback_geom_gist_idx", opclasses=["gist"]),
        ]
        ordering = ["-created_at"]

    def clean(self) -> None:
        if self.geom:
            self.geom = validate_geometry(self.geom)
