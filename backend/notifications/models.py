from django.db import models
from django.utils import timezone


class Banner(models.Model):
    message = models.TextField(max_length=500)
    start_date = models.DateTimeField(default=timezone.now)
    end_date = models.DateTimeField(null=True, blank=True)

    def is_displayable(self) -> bool:
        now = timezone.now()
        return (self.start_date <= now) and (self.end_date is None or self.end_date >= now)

    def __str__(self) -> str:
        return self.message
