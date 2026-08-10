from unittest.mock import MagicMock, patch

import pytest
from botocore.exceptions import ClientError
from django.conf import settings
from rest_framework.test import APIClient


def _valid_key() -> str:
    return f"{settings.PARENT_BUCKET_FOLDER}/zenml/base-models/m1/model/model.onnx"


def _url(key: str, bucket: str | None = None) -> str:
    return f"/api/v1/artifacts/{bucket or settings.BUCKET_NAME}/{key}"


@patch("shared.storage.presigned_get_url", return_value="https://signed.example/obj")
def test_get_redirects_to_presigned(mock_presign) -> None:
    resp = APIClient().get(_url(_valid_key()))
    assert resp.status_code == 302
    assert resp["Location"] == "https://signed.example/obj"


def test_get_rejects_foreign_bucket() -> None:
    assert APIClient().get(_url(_valid_key(), bucket="someone-else")).status_code == 404


def test_get_rejects_prefix_outside_model_collections() -> None:
    key = f"{settings.PARENT_BUCKET_FOLDER}/zenml/secrets/creds.txt"
    assert APIClient().get(_url(key)).status_code == 404


def test_head_ok_when_object_exists() -> None:
    fake = MagicMock()
    with patch.object(settings, "S3_CLIENT", fake):
        resp = APIClient().head(_url(_valid_key()))
    assert resp.status_code == 200
    fake.head_object.assert_called_once()


def test_head_404_when_object_missing() -> None:
    fake = MagicMock()
    fake.head_object.side_effect = ClientError({"Error": {"Code": "404"}}, "HeadObject")
    with patch.object(settings, "S3_CLIENT", fake):
        resp = APIClient().head(_url(_valid_key()))
    assert resp.status_code == 404


def test_head_propagates_non_404_error() -> None:
    fake = MagicMock()
    fake.head_object.side_effect = ClientError({"Error": {"Code": "403"}}, "HeadObject")
    with patch.object(settings, "S3_CLIENT", fake), pytest.raises(ClientError):
        APIClient().head(_url(_valid_key()))
