from django.db import models

# Input names are stored in `primary_input`, so requests are held to this length.
INPUT_NAME_MAX_LENGTH = 64


class InputImagery(models.Model):
    """Imagery per model input; jsonb keeps no key order, so the primary input is stored."""

    imagery = models.JSONField()
    primary_input = models.CharField(max_length=INPUT_NAME_MAX_LENGTH)

    class Meta:
        abstract = True

    @property
    def primary_imagery(self) -> str:
        imagery: dict[str, str] = self.imagery  # type: ignore[assignment]
        return imagery[self.primary_input]
