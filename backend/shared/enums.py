from django.db import models


class Visibility(models.TextChoices):
    """Owner-controlled read access for shareable artifacts."""

    PRIVATE = "private", "Private"
    PUBLIC = "public", "Public"
