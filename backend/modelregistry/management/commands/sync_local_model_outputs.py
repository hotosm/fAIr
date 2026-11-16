from django.core.management.base import BaseCommand, CommandError
from fair.stac.constants import DATACUBE_SCHEMA

from shared.integrations.stac import LOCAL_MODELS_COLLECTION, list_base_models, list_local_models

from ...views import _merge_validate_write

OUTPUT_PROPERTIES = ("mlm:output", "cube:variables", "mlm:accelerator", "mlm:accelerator_count")
RUNTIME_ASSETS = ("source-code", "mlm:training", "mlm:inference", "mlm:inference-endpoint")
# A local model's ONNX loads in the base model's images only when these still match.
MODEL_CONTRACT = ("mlm:architecture", "mlm:input")


class Command(BaseCommand):
    help = (
        "Move the local models fine-tuned from a base model onto that base model's current "
        "prediction outputs and runtime images."
    )

    def add_arguments(self, parser) -> None:
        parser.add_argument("--base-model", required=True, help="The base model's mlm:name.")
        parser.add_argument(
            "--dry-run", action="store_true", help="List the items to update, change nothing."
        )

    def handle(self, *args, base_model: str, dry_run: bool = False, **options) -> None:
        bases = [
            item
            for item in list_base_models()
            if item.properties.get("mlm:name") == base_model
            and not item.properties.get("deprecated")
        ]
        if len(bases) != 1:
            raise CommandError(
                f"expected one active base model named {base_model}, found {len(bases)}"
            )
        base = bases[0]
        properties = {
            key: base.properties[key] for key in OUTPUT_PROPERTIES if key in base.properties
        }
        assets = {key: base.assets[key].to_dict() for key in RUNTIME_ASSETS if key in base.assets}
        extensions = [DATACUBE_SCHEMA] if "cube:variables" in properties else []
        updated = 0
        for local in list_local_models():
            if local.properties.get("fair:base_model_name") != base_model:
                continue
            if mismatch := [
                key
                for key in MODEL_CONTRACT
                if local.properties.get(key) != base.properties.get(key)
            ]:
                self.stdout.write(
                    f"{local.id}: skipped, {', '.join(mismatch)} differ from {base.id}"
                )
                continue
            current = {
                key: local.assets[key].to_dict() for key in RUNTIME_ASSETS if key in local.assets
            }
            if current == assets and all(
                local.properties.get(key) == value for key, value in properties.items()
            ):
                self.stdout.write(f"{local.id}: already current")
                continue
            self.stdout.write(f"{local.id}: outputs and images from {base.id}")
            if not dry_run:
                _merge_validate_write(
                    LOCAL_MODELS_COLLECTION, local.id, properties, extensions, assets
                )
            updated += 1
        self.stdout.write(f"{updated} local model item(s) {'to update' if dry_run else 'updated'}")
