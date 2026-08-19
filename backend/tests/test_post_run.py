from unittest.mock import patch

from predictions.post_run import _generate_fgb, _generate_pmtiles

_EMPTY = {"type": "FeatureCollection", "features": []}


@patch("predictions.post_run.UPath")
def test_generate_fgb_handles_empty_features(mock_upath) -> None:
    _generate_fgb(_EMPTY, 99)
    mock_upath.assert_called_once()


@patch("predictions.post_run.subprocess.run")
def test_generate_pmtiles_skips_empty_features(mock_run) -> None:
    _generate_pmtiles(_EMPTY, 99)
    mock_run.assert_not_called()
