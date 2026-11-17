from unittest.mock import patch

import geopandas as gpd

from predictions.post_run import generate_geoparquet, _generate_pmtiles
from shared.storage import StoragePaths

_EMPTY = {"type": "FeatureCollection", "features": []}
_TWO_BUILDINGS = {
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "geometry": {"type": "Polygon", "coordinates": [[[0, 0], [1, 0], [1, 1], [0, 0]]]},
            "properties": {"class": 1, "confidence": 0.91},
        },
        {
            "type": "Feature",
            "geometry": {"type": "Polygon", "coordinates": [[[2, 2], [3, 2], [3, 3], [2, 2]]]},
            "properties": {"class": 1, "confidence": 0.62},
        },
    ],
}


def test_geoparquet_keeps_every_feature_with_its_properties_in_wgs84(tmp_path) -> None:
    target = tmp_path / "predictions.parquet"
    with patch.object(StoragePaths, "prediction_geoparquet_uri", return_value=str(target)):
        generate_geoparquet(_TWO_BUILDINGS, 99)

    written = gpd.read_parquet(target)
    assert written.crs.to_epsg() == 4326
    assert written["confidence"].tolist() == [0.91, 0.62]
    assert written.geometry.bounds.maxx.tolist() == [1.0, 3.0]


def test_geoparquet_of_no_features_is_an_empty_table(tmp_path) -> None:
    target = tmp_path / "predictions.parquet"
    with patch.object(StoragePaths, "prediction_geoparquet_uri", return_value=str(target)):
        generate_geoparquet(_EMPTY, 99)

    assert gpd.read_parquet(target).empty


@patch("predictions.post_run.subprocess.run")
def test_generate_pmtiles_skips_empty_features(mock_run) -> None:
    _generate_pmtiles(_EMPTY, 99)
    mock_run.assert_not_called()
