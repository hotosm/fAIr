import logging

from django.conf import settings
from django.contrib.contenttypes.models import ContentType
from django.core.mail import send_mail
from django.db import models

from .models import UserNotification

logger = logging.getLogger(__name__)


def send_user_notification(
    target: models.Model, message: str, *, subject: str | None = None
) -> UserNotification:
    """Deliver a notification on every channel the user opted into.

    Always writes the web record (the API surface for `/notifications/me/`).
    Additionally sends an email when the user has `email` in their
    `notifications_delivery_methods`.
    """
    user = getattr(target, "user", None)
    if user is None:
        raise ValueError(f"{target!r} has no .user attribute")

    record = UserNotification.objects.create(
        user=user,
        message=message,
        content_type=ContentType.objects.get_for_model(type(target)),
        object_id=target.pk,
    )

    methods = getattr(user, "notifications_delivery_methods", []) or []
    if "email" in methods and user.email:
        send_mail(
            subject=subject or "fAIr notification",
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )

    return record
