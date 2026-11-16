import logging

import httpx
from django.db.models import Count, IntegerField, OuterRef, QuerySet, Subquery
from django.db.models.functions import Coalesce

from feedback.models import Feedback
from predictions.models import Prediction
from shared.integrations.stac import (
    BASE_MODELS_COLLECTION,
    LOCAL_MODELS_COLLECTION,
    bulk_get_cached_items,
)

from .models import BaseModel, LocalModel

logger = logging.getLogger(__name__)


def registered_model_name(stac_id: str) -> str:
    """Name of the local or base model registered under `stac_id`, else ""."""
    for model in (LocalModel, BaseModel):
        name = model.objects.filter(stac_item_id=stac_id).values_list("name", flat=True).first()
        if name:
            return name
    return ""


def model_titles(stac_ids: set[str]) -> dict[str, str | None]:
    """STAC titles of the registered models among `stac_ids`."""
    pairs = [
        (collection, stac_id)
        for collection, model in (
            (BASE_MODELS_COLLECTION, BaseModel),
            (LOCAL_MODELS_COLLECTION, LocalModel),
        )
        for stac_id in model.objects.filter(stac_item_id__in=stac_ids).values_list(
            "stac_item_id", flat=True
        )
    ]
    try:
        items = bulk_get_cached_items(pairs)
    except (httpx.HTTPError, KeyError, ValueError):
        # Titles are display-only: if STAC fails or lacks an item, the caller shows the name.
        logger.warning("model titles unavailable for %s", sorted(stac_ids), exc_info=True)
        return {}
    return {
        stac_id: items[(collection, stac_id)]["properties"].get("title") or None
        for collection, stac_id in pairs
    }


def _count(queryset: QuerySet, expression) -> Coalesce:
    rows = queryset.filter(model_name=OuterRef("name")).order_by().values("model_name")
    return Coalesce(
        Subquery(rows.annotate(n=expression).values("n")[:1], output_field=IntegerField()), 0
    )


def annotate_usage(queryset: QuerySet) -> QuerySet:
    """Attach map request, user and feedback counts, keyed on the model name across versions."""
    return queryset.annotate(
        map_request_count=_count(Prediction.objects.all(), Count("id")),
        user_count=_count(Prediction.objects.all(), Count("user", distinct=True)),
        feedback_count=_count(Feedback.objects.all(), Count("id")),
    )
