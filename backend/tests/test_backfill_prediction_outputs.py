import io
import json
from unittest.mock import patch

import geopandas as gpd
import pytest
from django.core.management import call_command

from accounts.models import OsmUser
from predictions.models import Prediction
from shared.storage import StoragePaths

_ONE_BUILDING = {
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "geometry": {"type": "Polygon", "coordinates": [[[0, 0], [1, 0], [1, 1], [0, 0]]]},
            "properties": {"class": 1, "confidence": 0.8},
        }
    ],
}


@pytest.fixture
def ready_prediction(db) -> Prediction:
    user = OsmUser.objects.create(osm_id=12, username="emma")
    return Prediction.objects.create(
        local_model_stac_id="dinov3s-buildings",
        imagery={"image": "https://tiles.example.org/{z}/{x}/{y}"},
        primary_input="image",
        geometry={"type": "Polygon", "coordinates": [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]]},
        zoom=19,
        user=user,
        results_ready=True,
    )


def test_backfill_writes_geoparquet_for_ready_results_that_lack_one(tmp_path, ready_prediction) -> None:
    (tmp_path / "predictions.geojson").write_text(json.dumps(_ONE_BUILDING))
    target = tmp_path / "predictions.parquet"

    with (
        patch.object(StoragePaths, "prediction_geojson_uri", return_value=str(tmp_path / "predictions.geojson")),
        patch.object(StoragePaths, "prediction_geoparquet_uri", return_value=str(target)),
    ):
        call_command("backfill_prediction_outputs")
        written_once = target.stat().st_mtime_ns
        call_command("backfill_prediction_outputs")

    assert gpd.read_parquet(target)["confidence"].tolist() == [0.8]
    assert target.stat().st_mtime_ns == written_once


def test_backfill_reports_a_result_whose_geojson_is_gone_and_continues(tmp_path, ready_prediction) -> None:
    missing = tmp_path / "missing.geojson"
    target = tmp_path / "predictions.parquet"
    out = io.StringIO()

    with (
        patch.object(StoragePaths, "prediction_geojson_uri", return_value=str(missing)),
        patch.object(StoragePaths, "prediction_geoparquet_uri", return_value=str(target)),
    ):
        call_command("backfill_prediction_outputs", stdout=out)

    assert f"prediction {ready_prediction.pk}: GeoJSON not found" in out.getvalue()
    assert out.getvalue().endswith("1 skipped (GeoJSON missing)\n")
    assert not target.exists()


def test_backfill_leaves_a_map_request_without_results_alone(tmp_path, ready_prediction) -> None:
    Prediction.objects.filter(pk=ready_prediction.pk).update(results_ready=False)
    target = tmp_path / "predictions.parquet"
    out = io.StringIO()

    with (
        patch.object(StoragePaths, "prediction_geojson_uri", return_value=str(tmp_path / "x.geojson")),
        patch.object(StoragePaths, "prediction_geoparquet_uri", return_value=str(target)),
    ):
        call_command("backfill_prediction_outputs", stdout=out)

    assert out.getvalue() == "0 GeoParquet file(s) written, 0 feature count(s) recorded, 0 skipped (GeoJSON missing)\n"
    assert not target.exists()


def test_backfill_records_the_feature_count_of_results_that_lack_one(tmp_path, ready_prediction) -> None:
    (tmp_path / "predictions.geojson").write_text(json.dumps(_ONE_BUILDING))
    target = tmp_path / "predictions.parquet"
    target.write_bytes(b"already written")

    with (
        patch.object(StoragePaths, "prediction_geojson_uri", return_value=str(tmp_path / "predictions.geojson")),
        patch.object(StoragePaths, "prediction_geoparquet_uri", return_value=str(target)),
    ):
        call_command("backfill_prediction_outputs", stdout=io.StringIO())

    ready_prediction.refresh_from_db()
    assert ready_prediction.feature_count == 1
    assert target.read_bytes() == b"already written"
