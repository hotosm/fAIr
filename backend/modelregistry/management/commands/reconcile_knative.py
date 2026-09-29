import json

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from shared.integrations.zenml import get_master_client


class Command(BaseCommand):
    help = "Reconcile Knative services with active STAC base models."

    def add_arguments(self, parser) -> None:
        parser.add_argument(
            "--prune",
            action="store_true",
            help="Remove services for models no longer active in STAC.",
        )

    def handle(self, *args, prune: bool = False, **options) -> None:
        result = get_master_client().reconcile_knative(
            knative_template=settings.KNATIVE_SERVICE_TEMPLATE, prune=prune
        )
        self.stdout.write(json.dumps(result))
        if result["failed"]:
            raise CommandError(f"{len(result['failed'])} base model(s) failed to reconcile")
