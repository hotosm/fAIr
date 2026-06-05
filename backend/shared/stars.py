"""Shared helpers for annotating querysets with `star_count` and `is_starred`.

Stars are keyed on `Star.target_id` (no FK to LocalModel/Dataset), so the
join is via subquery rather than a related-name aggregate. Works for any
queryset whose rows expose a slug-shaped column. Datasets join on `stac_id`
(its slug); LocalModel joins on `name`.
"""

from django.db.models import (
    BooleanField,
    Count,
    Exists,
    IntegerField,
    OuterRef,
    QuerySet,
    Subquery,
    Value,
)
from django.db.models.functions import Coalesce

from stars.models import Star


def annotate_stars(queryset: QuerySet, request, *, key_field: str = "stac_id") -> QuerySet:
    """Attach `star_count` and `is_starred` annotations keyed on the row's `key_field`."""
    star_count_sq = Subquery(
        Star.objects.filter(target_id=OuterRef(key_field))
        .values("target_id")
        .annotate(c=Count("id"))
        .values("c")[:1],
        output_field=IntegerField(),
    )
    qs = queryset.annotate(star_count=Coalesce(star_count_sq, 0))
    user = getattr(request, "user", None)
    if user is not None and user.is_authenticated:
        qs = qs.annotate(
            is_starred=Exists(Star.objects.filter(target_id=OuterRef(key_field), user=user))
        )
    else:
        qs = qs.annotate(is_starred=Value(False, output_field=BooleanField()))
    return qs
