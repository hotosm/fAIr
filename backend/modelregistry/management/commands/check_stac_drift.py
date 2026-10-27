from collections.abc import Iterable

import pystac
from django.core.management.base import BaseCommand, CommandError

from datasets.models import Dataset
from shared.integrations.stac import (
    BASE_MODELS_COLLECTION,
    DATASETS_COLLECTION,
    FAIR_PINNED_PROPERTY,
    LOCAL_MODELS_COLLECTION,
    list_base_models,
    list_datasets,
    list_local_models,
)

from ...models import BaseModel, LocalModel


class Command(BaseCommand):
    help = "Report rows and STAC items that disagree; exits non-zero on any drift."

    def handle(self, *args, **options) -> None:
        findings = [
            *_drift(
                BASE_MODELS_COLLECTION, list_base_models(), BaseModel.objects.all(), "stac_item_id"
            ),
            *_drift(
                LOCAL_MODELS_COLLECTION,
                list_local_models(),
                LocalModel.objects.all(),
                "stac_item_id",
            ),
            *_drift(
                DATASETS_COLLECTION,
                list_datasets(),
                Dataset.objects.filter(status=Dataset.Status.BUILT),
                "stac_id",
            ),
        ]
        for finding in findings:
            self.stdout.write(finding)
        if findings:
            raise CommandError(f"{len(findings)} drift finding(s)")
        self.stdout.write("no drift")


def _drift(
    collection: str, items: Iterable[pystac.Item], rows: Iterable, id_field: str
) -> list[str]:
    # Deprecated items are the archived versions of a live item, so no row points at them.
    live = {item.id: item for item in items if not item.properties.get("deprecated")}
    findings, row_ids = [], set()
    for row in rows:
        item_id = getattr(row, id_field)
        if not item_id:
            continue
        row_ids.add(item_id)
        item = live.get(item_id)
        if item is None:
            findings.append(f"{collection}/{item_id}: row {row.pk} has no live STAC item")
        # Datasets keep their pin in STAC only, so only model rows carry one to compare.
        elif hasattr(row, "is_pinned") and row.is_pinned != bool(
            item.properties.get(FAIR_PINNED_PROPERTY)
        ):
            findings.append(f"{collection}/{item_id}: row pinned={row.is_pinned}, STAC disagrees")
    orphans = sorted(live.keys() - row_ids)
    return findings + [f"{collection}/{item_id}: STAC item has no row" for item_id in orphans]
