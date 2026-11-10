from django.db import models

from accounts.models import OsmUser


class Star(models.Model):
    # `target_id` is the family-level slug of the starred entity:

    target_id = models.CharField(max_length=200)
    user = models.ForeignKey(
        OsmUser,
        to_field="osm_id",
        on_delete=models.CASCADE,
        related_name="stars",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["target_id", "user"], name="unique_user_star"),
        ]
