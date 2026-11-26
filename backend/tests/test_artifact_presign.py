from unittest.mock import MagicMock, patch

import pytest
from botocore.exceptions import ClientError
from django.conf import settings
from rest_framework.test import APIClient

from datasets.models import Dataset
from shared.enums import Visibility


def _valid_key() -> str:
    return f"{settings.PARENT_BUCKET_FOLDER}/zenml/base-models/m1/model/model.onnx"


def _url(key: str, bucket: str | None = None) -> str:
    return f"/api/v1/artifacts/{bucket or settings.BUCKET_NAME}/{key}"


@pytest.mark.django_db
@patch("shared.storage.presigned_get_url", return_value="https://signed.example/obj")
def test_get_redirects_to_presigned(mock_presign) -> None:
    resp = APIClient().get(_url(_valid_key()))
    assert resp.status_code == 302
    assert resp["Location"] == "https://signed.example/obj"


@pytest.mark.django_db
def test_get_rejects_foreign_bucket() -> None:
    assert APIClient().get(_url(_valid_key(), bucket="someone-else")).status_code == 404


@pytest.mark.django_db
def test_get_rejects_prefix_outside_model_collections() -> None:
    key = f"{settings.PARENT_BUCKET_FOLDER}/zenml/secrets/creds.txt"
    assert APIClient().get(_url(key)).status_code == 404


@pytest.mark.django_db
def test_head_ok_when_object_exists() -> None:
    fake = MagicMock()
    with patch.object(settings, "S3_CLIENT", fake):
        resp = APIClient().head(_url(_valid_key()))
    assert resp.status_code == 200
    fake.head_object.assert_called_once()


@pytest.mark.django_db
def test_head_404_when_object_missing() -> None:
    fake = MagicMock()
    fake.head_object.side_effect = ClientError({"Error": {"Code": "404"}}, "HeadObject")
    with patch.object(settings, "S3_CLIENT", fake):
        resp = APIClient().head(_url(_valid_key()))
    assert resp.status_code == 404


@pytest.mark.django_db
def test_head_propagates_non_404_error() -> None:
    fake = MagicMock()
    fake.head_object.side_effect = ClientError({"Error": {"Code": "403"}}, "HeadObject")
    with patch.object(settings, "S3_CLIENT", fake), pytest.raises(ClientError):
        APIClient().head(_url(_valid_key()))


def _dataset_key(stac_id: str) -> str:
    folder = settings.PARENT_BUCKET_FOLDER
    return f"{folder}/zenml/{folder}/datasets/{stac_id}/v1/labels_pmtiles/labels.pmtiles"


def _bundle_dataset(owner, visibility: str) -> Dataset:
    return Dataset.objects.create(
        stac_id="d1", title="d1", imagery={}, visibility=visibility, user=owner
    )


@pytest.mark.django_db
@pytest.mark.parametrize(
    ("visibility", "viewer", "expected"),
    [
        (Visibility.PUBLIC, None, 302),
        (Visibility.PRIVATE, None, 404),
        (Visibility.PRIVATE, "other_user", 404),
        (Visibility.PRIVATE, "user", 302),
        (Visibility.PRIVATE, "admin_user", 302),
    ],
)
@patch("shared.storage.presigned_get_url", return_value="https://signed.example/obj")
def test_dataset_bundle_downloads_follow_the_dataset_visibility(
    mock_presign, request, user, visibility, viewer, expected
) -> None:
    _bundle_dataset(user, visibility)
    signed_in = (request.getfixturevalue(viewer), None) if viewer else None

    with patch("accounts.authentication.OsmAuthentication.authenticate", return_value=signed_in):
        resp = APIClient().get(_url(_dataset_key("d1")))

    assert resp.status_code == expected


@pytest.mark.django_db
def test_a_bundle_key_without_a_dataset_is_not_found() -> None:
    assert APIClient().get(_url(_dataset_key("gone"))).status_code == 404


@pytest.mark.django_db
def test_head_answers_for_a_private_dataset_bundle(user) -> None:
    _bundle_dataset(user, Visibility.PRIVATE)
    with patch.object(settings, "S3_CLIENT") as client:
        client.head_object.return_value = {}
        assert APIClient().head(_url(_dataset_key("d1"))).status_code == 200


@pytest.mark.django_db
@patch("shared.storage.presigned_get_url", return_value="https://signed.example/obj")
def test_a_bad_token_does_not_block_a_model_artifact(mock_presign) -> None:
    resp = APIClient().get(_url(_valid_key()), HTTP_AUTHORIZATION="Bearer wrong")

    assert resp.status_code == 302


@pytest.mark.django_db
@patch("shared.storage.presigned_get_url", return_value="https://signed.example/obj")
def test_a_signed_in_admin_token_downloads_a_private_dataset_bundle(mock_presign, user) -> None:
    _bundle_dataset(user, Visibility.PRIVATE)
    token = f"Bearer {settings.FAIR_DEV_TOKEN}"

    assert APIClient().get(_url(_dataset_key("d1")), HTTP_AUTHORIZATION=token).status_code == 302
    assert APIClient().get(_url(_dataset_key("d1"))).status_code == 404


@pytest.mark.django_db
def test_a_bad_token_on_a_private_dataset_bundle_is_not_found(user) -> None:
    _bundle_dataset(user, Visibility.PRIVATE)

    resp = APIClient().get(_url(_dataset_key("d1")), HTTP_AUTHORIZATION="Bearer wrong")

    assert resp.status_code == 404


@pytest.mark.django_db
def test_the_old_dataset_folder_is_not_served() -> None:
    key = f"{settings.PARENT_BUCKET_FOLDER}/zenml/datasets/d1/v1/labels_pmtiles/labels.pmtiles"

    assert APIClient().get(_url(key)).status_code == 404


@pytest.mark.django_db
@pytest.mark.parametrize(
    ("visibility", "viewer", "expected"),
    [
        (Visibility.PUBLIC, None, 302),
        (Visibility.PRIVATE, None, 404),
        (Visibility.PRIVATE, "other_user", 404),
        (Visibility.PRIVATE, "user", 302),
        (Visibility.PRIVATE, "admin_user", 302),
    ],
)
@patch("shared.storage.presigned_get_url", return_value="https://signed.example/obj")
def test_mirrored_dataset_downloads_follow_the_dataset_visibility(
    mock_presign, request, user, visibility, viewer, expected
) -> None:
    _bundle_dataset(user, visibility)
    signed_in = (request.getfixturevalue(viewer), None) if viewer else None

    with (
        patch.object(settings, "S3_CLIENT") as s3,
        patch("accounts.authentication.OsmAuthentication.authenticate", return_value=signed_in),
    ):
        s3.list_objects_v2.return_value = {"Contents": [{"Key": "mirrored/download.zip"}]}
        resp = APIClient().get("/api/v1/stac-assets/datasets/d1/download/")

    assert resp.status_code == expected


@pytest.mark.django_db
def test_a_mirrored_asset_without_a_dataset_is_not_found() -> None:
    with patch.object(settings, "S3_CLIENT") as s3:
        resp = APIClient().get("/api/v1/stac-assets/datasets/gone/download/")

    assert resp.status_code == 404
    s3.list_objects_v2.assert_not_called()
