import io
import zipfile
from unittest.mock import MagicMock, patch

import pytest
from django.conf import settings

from accounts.models import OsmUser
from datasets.models import Dataset
from shared.enums import Visibility
from shared.storage import StoragePaths


def _dataset(user: OsmUser, status: str = Dataset.Status.BUILT) -> Dataset:
    return Dataset.objects.create(
        stac_id="demo-ds",
        title="Demo",
        imagery={"image": "https://tiles.example/{z}/{x}/{y}.png"},
        primary_input="image",
        status=status,
        visibility=Visibility.PUBLIC,
        user=user,
    )


def _fake_s3(objects: dict[str, bytes]) -> MagicMock:
    fake = MagicMock()

    def paginate(**kwargs):
        prefix = kwargs["Prefix"]
        return [{"Contents": [{"Key": k} for k in objects if k.startswith(prefix)]}]

    fake.get_paginator.return_value.paginate.side_effect = paginate
    fake.get_object.side_effect = lambda **kwargs: {"Body": io.BytesIO(objects[kwargs["Key"]])}
    return fake


def test_download_zips_chips_and_labels(client, user):
    dataset = _dataset(user)
    chips = StoragePaths.dataset_chips_dir_key(dataset.stac_id, "image")
    objects = {
        StoragePaths.dataset_labels_geojson_key(dataset.stac_id): b'{"type": "FeatureCollection"}',
        f"{chips}/OAM-1-2-18.tif": b"chip-a",
        f"{chips}/OAM-1-3-18.tif": b"chip-b",
    }
    with patch.object(settings, "S3_CLIENT", _fake_s3(objects)):
        response = client.get(f"/api/v1/datasets/{dataset.id}/download/")
        body = b"".join(response.streaming_content)

    assert response.status_code == 200
    assert response["Content-Type"] == "application/zip"
    assert 'filename="demo-ds.zip"' in response["Content-Disposition"]
    with zipfile.ZipFile(io.BytesIO(body)) as zf:
        assert sorted(zf.namelist()) == [
            "demo-ds/chips/OAM-1-2-18.tif",
            "demo-ds/chips/OAM-1-3-18.tif",
            "demo-ds/labels/labels.geojson",
        ]
        assert zf.read("demo-ds/chips/OAM-1-2-18.tif") == b"chip-a"


@pytest.mark.parametrize("status", [Dataset.Status.DRAFT, Dataset.Status.BUILDING])
def test_download_rejects_unbuilt_dataset(client, user, status):
    dataset = _dataset(user, status=status)
    response = client.get(f"/api/v1/datasets/{dataset.id}/download/")
    assert response.status_code == 409
