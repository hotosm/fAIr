from django.test import override_settings

from shared.storage import StoragePaths


@override_settings(PARENT_BUCKET_FOLDER="dev", BUCKET_NAME="fair-dev")
def test_keys_and_uris_carry_the_folder_prefix():
    assert StoragePaths.prediction_geojson_key(3) == "dev/predict/3/output/predictions.geojson"
    assert (
        StoragePaths.prediction_geojson_uri(3)
        == "s3://fair-dev/dev/predict/3/output/predictions.geojson"
    )
    assert StoragePaths.prediction_input_dir_key(3) == "dev/predict/3/input"
    assert StoragePaths.dataset_chips_dir_key("ds1") == "dev/datasets/ds1/chips"
    labels_key = StoragePaths.dataset_labels_geojson_key("ds1")
    assert labels_key == "dev/datasets/ds1/labels/labels.geojson"
    assert StoragePaths.local_model_onnx_key("m1") == "dev/local-models/m1/model/model.onnx"


@override_settings(PARENT_BUCKET_FOLDER="")
def test_empty_prefix_keeps_keys_at_bucket_root():
    assert StoragePaths.prediction_output_dir_key(3) == "predict/3/output"
    assert StoragePaths.dataset_chips_dir_key("ds1") == "datasets/ds1/chips"
