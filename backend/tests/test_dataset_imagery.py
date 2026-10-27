from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from django.contrib.gis.geos import Polygon
from rest_framework.test import APIClient

from accounts.models import OsmUser
from datasets.models import AOI, Dataset
from datasets.serializers import DatasetSerializer
from datasets.tasks import _materialize_dataset_assets, build_dataset

POST_TMS = "https://tiles.example/post/{z}/{x}/{y}.png"
PRE_TMS = "https://tiles.example/pre/{z}/{x}/{y}.png"


@pytest.fixture
def user(db) -> OsmUser:
    return OsmUser.objects.create(osm_id=3001, username="mapper")


@pytest.fixture
def client(user: OsmUser) -> APIClient:
    api = APIClient()
    api.force_authenticate(user=user)
    return api


@pytest.fixture
def aoi(user: OsmUser) -> AOI:
    polygon = Polygon(
        ((85.5, 27.6), (85.5, 27.61), (85.51, 27.61), (85.51, 27.6), (85.5, 27.6)), srid=4326
    )
    return AOI.objects.create(geom=polygon, user=user)


def _payload(aoi: AOI, **imagery: object) -> dict:
    return {
        "title": "Pokhara damage",
        "description": "pre and post",
        "category": "buildings",
        "zoom": 19,
        "aoi_ids": [aoi.id],
        "label_tasks": ["semantic-segmentation"],
        "label_classes": [{"name": "building", "classes": ["*"]}],
        "keywords": ["buildings"],
        "geometry_type": "polygon",
        **imagery,
    }


def _build(client: APIClient, aoi: AOI, **imagery: object):
    return client.post("/api/v1/datasets/build/", data=_payload(aoi, **imagery), format="json")


@pytest.mark.parametrize(
    ("imagery", "primary_url"),
    [({"post": POST_TMS, "pre": PRE_TMS}, POST_TMS), ({"pre": PRE_TMS, "post": POST_TMS}, PRE_TMS)],
    ids=["post first", "pre first"],
)
@patch("datasets.views.build_dataset")
def test_build_takes_the_first_request_input_as_primary(mock_task, client, aoi, imagery, primary_url):
    response = _build(client, aoi, imagery=imagery)
    assert response.status_code == 202, response.content
    assert response.json()["imagery"] == {"post": POST_TMS, "pre": PRE_TMS}
    stored = Dataset.objects.get(id=response.json()["id"])
    assert stored.primary_imagery == primary_url
    assert DatasetSerializer(stored).data["source_imagery"] == primary_url


@patch("datasets.views.build_dataset")
def test_build_reads_source_imagery_as_the_image_input(mock_task, client, aoi):
    response = _build(client, aoi, source_imagery=POST_TMS)
    assert response.status_code == 202, response.content
    assert Dataset.objects.get(id=response.json()["id"]).imagery == {"image": POST_TMS}


@pytest.mark.parametrize("imagery", [{}, {"imagery": {"image": POST_TMS}, "source_imagery": POST_TMS}])
@patch("datasets.views.build_dataset")
def test_build_needs_exactly_one_of_imagery_or_source_imagery(mock_task, client, aoi, imagery):
    response = _build(client, aoi, **imagery)
    assert response.status_code == 400
    assert "imagery" in response.json()["error"]["details"]
    mock_task.enqueue.assert_not_called()


@pytest.mark.parametrize(
    ("imagery", "message"),
    [
        ({"pre": "https://tiles.example/pre.png"}, "placeholders"),
        ({"Pre Event": PRE_TMS}, "lowercase letters"),
    ],
)
@patch("datasets.views.build_dataset")
def test_build_rejects_unusable_imagery(mock_task, client, aoi, imagery, message):
    response = _build(client, aoi, imagery=imagery)
    assert response.status_code == 400
    assert message in str(response.json()["error"]["details"]["imagery"])
    mock_task.enqueue.assert_not_called()


@patch("datasets.views.build_dataset")
def test_build_stores_a_cog_tile_url_longer_than_200_characters(mock_task, client, aoi):
    prefix = "https://titiler.example/cog/tiles/WebMercatorQuad/{z}/{x}/{y}?url="
    url = prefix + "a" * (500 - len(prefix))
    response = _build(client, aoi, imagery={"image": url})
    assert response.status_code == 202, response.content
    assert Dataset.objects.get(id=response.json()["id"]).imagery == {"image": url}


@pytest.mark.parametrize(
    ("imagery", "field"),
    [
        ({"source_imagery": "http://10.0.0.5/tiles/{z}/{x}/{y}.png"}, "source_imagery"),
        ({"imagery": {"post": POST_TMS, "pre": "http://169.254.169.254/{z}/{x}/{y}"}}, "imagery"),
    ],
)
@patch("datasets.views.build_dataset")
def test_build_rejects_imagery_on_a_private_host(mock_task, client, aoi, imagery, field):
    response = _build(client, aoi, **imagery)
    assert response.status_code == 400
    assert field in response.json()["error"]["details"]
    mock_task.enqueue.assert_not_called()


def _dataset(user: OsmUser, aoi: AOI) -> Dataset:
    dataset = Dataset.objects.create(
        stac_id="pokhara-damage",
        title="Pokhara damage",
        imagery={"post": POST_TMS, "pre": PRE_TMS}, primary_input="post",
        user=user,
    )
    aoi.dataset = dataset
    aoi.save(update_fields=["dataset"])
    return dataset


def _materialize(dataset: Dataset):
    return _materialize_dataset_assets(
        dataset,
        zoom=19,
        label_classes=[{"name": "building", "classes": ["*"]}],
        geometry_type="polygon",
        labels_url=None,
    )


def _downloads(files_by_url: dict[str, list[str]]):
    return lambda url, *args: {name: Path(name) for name in files_by_url[url]}


@patch("datasets.tasks.UPath", side_effect=lambda uri: MagicMock(name=uri))
@patch("geomltoolkits.downloader.osm.download_osm_data", AsyncMock(return_value={"features": []}))
def test_materialize_keeps_the_tiles_every_input_has(mock_upath, user, aoi):
    dataset = _dataset(user, aoi)
    files = {POST_TMS: ["OAM-1-2-19.tif", "OAM-1-3-19.tif"], PRE_TMS: ["OAM-1-2-19.tif", "OAM-1-4-19.tif"]}
    with (
        patch("datasets.tasks._download_chips", side_effect=_downloads(files)) as download,
        patch("datasets.tasks.upload_chips") as upload,
    ):
        chips_hrefs, *_ = _materialize(dataset)

    assert {call.args[0] for call in download.call_args_list} == {POST_TMS, PRE_TMS}
    first_call, second_call = download.call_args_list
    assert first_call.args[1:3] == second_call.args[1:3]
    assert [call.args[1] for call in upload.call_args_list] == [{"OAM-1-2-19.tif"}, {"OAM-1-2-19.tif"}]
    assert set(chips_hrefs) == {"post", "pre"}
    assert "datasets/pokhara-damage/chips-pre" in chips_hrefs["pre"]


@patch("datasets.tasks.UPath", MagicMock())
@patch("geomltoolkits.downloader.osm.download_osm_data", AsyncMock(return_value={"features": []}))
def test_materialize_fails_when_no_tile_has_every_input(user, aoi):
    dataset = _dataset(user, aoi)
    files = {POST_TMS: ["OAM-1-2-19.tif"], PRE_TMS: ["OAM-1-3-19.tif"]}
    with (
        patch("datasets.tasks._download_chips", side_effect=_downloads(files)),
        patch("datasets.tasks.upload_chips"),
        pytest.raises(RuntimeError, match="no tile has imagery for every input"),
    ):
        _materialize(dataset)


@patch("shared.storage.presigned_get_url", side_effect=lambda key: f"https://signed/{key}")
def test_assets_link_the_chips_of_each_input(mock_sign, user):

    paired = Dataset.objects.create(
        stac_id="paired",
        title="Paired",
        imagery={"post": POST_TMS, "pre": PRE_TMS}, primary_input="post",
        status=Dataset.Status.BUILT,
        user=user,
    )
    single = Dataset.objects.create(
        stac_id="single", title="Single", imagery={"image": POST_TMS}, primary_input="image", status=Dataset.Status.BUILT, user=user
    )

    paired_chips = DatasetSerializer(paired).data["assets"]["chips"]
    assert [paired_chips[name].rsplit("/", 1)[-1] for name in ("post", "pre")] == ["chips-post", "chips-pre"]
    assert DatasetSerializer(single).data["assets"]["chips"]["image"].endswith("datasets/single/chips")


@pytest.mark.parametrize("field", ["imagery", "source_imagery"])
def test_patching_a_dataset_rejects_imagery(client, user, field):
    dataset = Dataset.objects.create(
        stac_id="fixed", title="Fixed", imagery={"image": POST_TMS}, primary_input="image", user=user
    )
    value = {"image": PRE_TMS} if field == "imagery" else PRE_TMS
    response = client.patch(f"/api/v1/datasets/{dataset.id}/", data={field: value}, format="json")
    assert response.status_code == 400
    assert field in response.json()["error"]["details"]
    dataset.refresh_from_db()
    assert dataset.imagery == {"image": POST_TMS}


def test_a_long_input_name_is_rejected(client, aoi):
    response = _build(client, aoi, imagery={"a" * 65: POST_TMS})
    assert response.status_code == 400
    assert "longer than 64" in str(response.json()["error"]["details"])


@patch("modelregistry.tasks.mirror_stac_assets_task")
@patch("datasets.tasks.for_user")
@patch("datasets.tasks._materialize_dataset_assets")
def test_build_registers_the_primary_imagery_as_source_imagery(mock_materialize, mock_for_user, mock_mirror, user, aoi):
    dataset = _dataset(user, aoi)
    dataset.imagery = {"pre": PRE_TMS, "post": POST_TMS}
    dataset.save(update_fields=["imagery"])
    mock_materialize.return_value = ({"post": "s3://c/post", "pre": "s3://c/pre"}, "s3://c/labels", {}, [0, 0, 1, 1])
    mock_for_user.return_value.register_dataset.return_value = dataset.stac_id

    build_dataset.call(
        dataset_id=dataset.id,
        description="damage",
        label_tasks=["segmentation"],
        label_classes=[{"name": "building", "classes": ["*"]}],
        keywords=["building"],
        label_type="vector",
        zoom=19,
        geometry_type="polygon",
    )

    params = mock_for_user.return_value.register_dataset.call_args.args[0]
    assert params.source_imagery == POST_TMS
    assert params.imagery_hrefs == {"post": POST_TMS, "pre": PRE_TMS}


@patch("datasets.tasks._materialize_dataset_assets", side_effect=RuntimeError("no tile has every input"))
def test_a_failed_build_marks_the_dataset_failed_with_the_error(mock_materialize, user, aoi):
    dataset = _dataset(user, aoi)

    with pytest.raises(RuntimeError):
        build_dataset.call(
            dataset_id=dataset.id,
            description="damage",
            label_tasks=["segmentation"],
            label_classes=[{"name": "building", "classes": ["*"]}],
            keywords=["building"],
            label_type="vector",
            zoom=19,
            geometry_type="polygon",
        )

    dataset.refresh_from_db()
    assert dataset.status == Dataset.Status.FAILED
    assert dataset.error == "RuntimeError: no tile has every input"
