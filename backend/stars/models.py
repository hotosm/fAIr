from django.db import models

from accounts.models import OsmUser


class Star(models.Model):
    # `target_id` is the family-level slug of the starred entity:

    target_id = models.CharField(max_length=200, db_index=True)
    user = models.ForeignKey(
        OsmUser,
        to_field="osm_id",
        on_delete=models.CASCADE,
        related_name="stars",
        null=True,
        blank=True,
    )
    anon_key = models.CharField(max_length=64, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["target_id", "user"],
                condition=models.Q(user__isnull=False),
                name="unique_user_star",
            ),
            models.UniqueConstraint(
                fields=["target_id", "anon_key"],
                condition=models.Q(user__isnull=True),
                name="unique_anon_star",
            ),
        ]
        indexes = [
            models.Index(fields=["target_id"]),
        ]
