from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models
from django.utils import timezone

from accounts.models import OsmUser


class Banner(models.Model):
    message = models.TextField(max_length=500)
    start_date = models.DateTimeField(default=timezone.now)
    end_date = models.DateTimeField(null=True, blank=True)

    def is_displayable(self) -> bool:
        now = timezone.now()
        return (self.start_date <= now) and (self.end_date is None or self.end_date >= now)

    def __str__(self) -> str:
        return self.message


class UserNotification(models.Model):
    user = models.ForeignKey(
        OsmUser,
        to_field="osm_id",
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now)
    read_at = models.DateTimeField(null=True, blank=True)
    message = models.TextField(max_length=500)
    content_type = models.ForeignKey(ContentType, on_delete=models.DO_NOTHING, null=True)
    object_id = models.PositiveIntegerField(null=True)
    related_object = GenericForeignKey("content_type", "object_id")

    class Meta:
        indexes = [
            models.Index(fields=["is_read"]),
            models.Index(fields=["user"]),
        ]
        ordering = ["-created_at"]

    def mark_as_read(self) -> None:
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save()

    def __str__(self) -> str:
        return f"Notification for {self.user.username}: {self.message[:50]}"
