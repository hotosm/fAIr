from unittest.mock import patch

import pytest
from django.test import override_settings
from upath import UPath

from shared.storage import StoragePaths, remove_dir


@override_settings(PARENT_BUCKET_FOLDER="dev", BUCKET_NAME="fair-dev")
def test_keys_and_uris_carry_the_folder_prefix():
    assert StoragePaths.prediction_geojson_key(3) == "dev/predict/3/output/predictions.geojson"
    assert (
        StoragePaths.prediction_geojson_uri(3)
        == "s3://fair-dev/dev/predict/3/output/predictions.geojson"
    )
    assert StoragePaths.prediction_input_dir_key(3, "post") == "dev/predict/3/input/post"
    assert StoragePaths.dataset_chips_dir_key("ds1", "image") == "dev/datasets/ds1/chips"
    labels_key = StoragePaths.dataset_labels_geojson_key("ds1")
    assert labels_key == "dev/datasets/ds1/labels/labels.geojson"


@override_settings(PARENT_BUCKET_FOLDER="")
def test_empty_prefix_keeps_keys_at_bucket_root():
    assert StoragePaths.prediction_output_dir_key(3) == "predict/3/output"
    assert StoragePaths.dataset_chips_dir_key("ds1", "pre") == "datasets/ds1/chips-pre"


def test_remove_dir_deletes_a_folder_tree_and_ignores_a_missing_one(tmp_path):
    folder = tmp_path / "predict" / "3" / "input"
    (folder / "image").mkdir(parents=True)
    (folder / "image" / "0_0_19.tif").write_bytes(b"tile")

    remove_dir(str(folder))
    remove_dir(str(folder))

    assert not folder.exists()


def test_remove_dir_raises_when_the_store_keeps_the_files():
    folder = UPath("memory://predict/4/input/image")
    (folder / "0_0_19.tif").write_bytes(b"tile")

    with patch.object(type(folder.fs), "rm"), pytest.raises(OSError, match="still exists"):
        remove_dir(str(folder))
    folder.fs.rm(folder.path, recursive=True)
