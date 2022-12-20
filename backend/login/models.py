from django.contrib.auth.models import AbstractUser
from django.db import models


class OsmUser(AbstractUser):
    REQUIRED_FIELDS = ("osm_id",)
    osm_id = models.BigIntegerField(blank=False, unique=True, null=False)
    img_url = models.URLField(null=True, blank=True, max_length=1000)
