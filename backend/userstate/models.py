from django.db import models

from accounts.models import OsmUser


class UserState(models.Model):
    """Frontend-owned JSON saved per user; the backend stores it without interpreting it."""

    pid = models.BigAutoField(primary_key=True)
    state = models.JSONField()
    timestamp = models.DateTimeField(auto_now=True)
    user = models.ForeignKey(
        OsmUser,
        to_field="osm_id",
        on_delete=models.CASCADE,
        related_name="user_states",
    )

    class Meta:
        db_table = "user_state"
        ordering = ["-timestamp"]
