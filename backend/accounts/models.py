from typing import Any

from django.contrib.auth.models import AbstractUser
from django.db import models


class OsmUser(AbstractUser):
    class Meta:
        db_table = "auth_user"

    REQUIRED_FIELDS = ("osm_id",)
    # OSM display names run to 255 characters and may hold characters Django's validator rejects.
    username = models.CharField(max_length=255, unique=True)
    osm_id = models.BigIntegerField(blank=False, unique=True, null=False)
    img_url = models.URLField(null=True, blank=True, max_length=1000)

    newsletter_subscription = models.BooleanField(default=False)
    account_deletion_requested = models.BooleanField(default=False)
    email_verified = models.BooleanField(default=False)

    def stac_producer(self) -> dict[str, Any]:
        """STAC provider entry naming this user as producer."""
        return {"name": self.username or str(self.osm_id), "roles": ["producer"]}
