import json

from django.core.management.base import BaseCommand
from upath import UPath

from predictions.models import Prediction
from predictions.post_run import generate_geoparquet
from shared.storage import StoragePaths


class Command(BaseCommand):
    help = "Write missing GeoParquet and record missing feature counts for finished map requests."

    def handle(self, *args, **options) -> None:
        written = counted = skipped = 0
        for prediction in Prediction.objects.filter(results_ready=True).only("id", "feature_count"):
            has_geoparquet = UPath(StoragePaths.prediction_geoparquet_uri(prediction.id)).exists()
            if has_geoparquet and prediction.feature_count is not None:
                continue
            try:
                geojson = json.loads(
                    UPath(StoragePaths.prediction_geojson_uri(prediction.id)).read_text()
                )
            except FileNotFoundError:
                self.stdout.write(f"prediction {prediction.id}: GeoJSON not found, skipped")
                skipped += 1
                continue
            if not has_geoparquet:
                generate_geoparquet(geojson, prediction.id)
                written += 1
                self.stdout.write(f"prediction {prediction.id}: GeoParquet written")
            if prediction.feature_count is None:
                Prediction.objects.filter(id=prediction.id).update(
                    feature_count=len(geojson.get("features", []))
                )
                counted += 1
        self.stdout.write(
            f"{written} GeoParquet file(s) written, {counted} feature count(s) recorded, "
            f"{skipped} skipped (GeoJSON missing)"
        )
