import http.server
import json
import socket
import tempfile
import threading
import time
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

import aiohttp
import fsspec
import geopandas as gpd
import pandas as pd
import pytest
from django.contrib.gis.geos import Polygon
from django.core.files.uploadedfile import SimpleUploadedFile
from shapely.geometry import box, shape

from accounts.models import OsmUser
from datasets import label_sources
from datasets.label_sources import LabelsSourceError, download_labels
from datasets.models import AOI, Dataset
from datasets.tasks import _materialize_dataset_assets
from shared import public_urls

AOI_POLYGON = Polygon(
    ((85.5, 27.6), (85.5, 27.61), (85.51, 27.61), (85.51, 27.6), (85.5, 27.6)), srid=4326
)


def _square(west: float, south: float, size: float = 0.001) -> dict:
    ring = [
        [west, south],
        [west + size, south],
        [west + size, south + size],
        [west, south + size],
        [west, south],
    ]
    return {"type": "Polygon", "coordinates": [ring]}


def _feature(geometry: dict, properties: object) -> dict:
    return {"type": "Feature", "geometry": geometry, "properties": properties}


@pytest.fixture
def aoi(user: OsmUser) -> AOI:
    return AOI.objects.create(geom=AOI_POLYGON, user=user)


def test_labels_url_rejects_a_non_https_url():
    with pytest.raises(public_urls.NonPublicURLError, match="https"):
        _fetch("http://example.org/labels.geojson")


def test_labels_url_rejects_a_host_that_resolves_to_a_private_address():
    with pytest.raises(public_urls.NonPublicURLError, match="non-public"):
        _fetch("https://127.0.0.1/labels.geojson")


def test_labels_url_rejects_a_nat64_address(monkeypatch):
    monkeypatch.setattr(
        public_urls.socket,
        "getaddrinfo",
        lambda host, port, type: [(socket.AF_INET6, type, 6, "", ("64:ff9b::7f00:1", port, 0, 0))],
    )
    with pytest.raises(public_urls.NonPublicURLError, match="non-public"):
        _fetch("https://example.org/labels.geojson")


def test_a_nat64_address_of_a_public_host_is_accepted(monkeypatch):
    monkeypatch.setattr(
        public_urls.socket,
        "getaddrinfo",
        lambda host, port, type: [
            (socket.AF_INET6, type, 6, "", ("64:ff9b::22c7:9476", port, 0, 0))
        ],
    )

    public_urls.require_public_url("https://api.imagery.example/tiles/{z}/{x}/{y}", ("https",))


@pytest.mark.parametrize(
    "addresses",
    [
        [(socket.AF_INET6, "::127.0.0.1")],
        [(socket.AF_INET, "93.184.215.14"), (socket.AF_INET, "10.0.0.5")],
    ],
    ids=["ipv4-compatible-loopback", "one-of-several-private"],
)
def test_labels_url_rejects_hosts_with_any_non_public_address(monkeypatch, addresses):
    monkeypatch.setattr(
        public_urls.socket,
        "getaddrinfo",
        lambda host, port, type: [(family, type, 6, "", (ip, port)) for family, ip in addresses],
    )
    with pytest.raises(public_urls.NonPublicURLError, match="non-public"):
        _fetch("https://example.org/labels.geojson")


def test_labels_url_checks_the_idna_host_the_client_connects_to(monkeypatch):
    checked = []

    def resolve(host, port, type):
        checked.append(host)
        return [(socket.AF_INET, type, 6, "", ("10.0.0.5", port))]

    monkeypatch.setattr(public_urls.socket, "getaddrinfo", resolve)
    with pytest.raises(public_urls.NonPublicURLError, match="non-public"):
        _fetch("https://bücher.example/labels.geojson")
    assert checked == ["xn--bcher-kva.example"]


def test_labels_url_rejects_a_host_that_does_not_resolve(monkeypatch):
    def fail(*args, **kwargs):
        raise socket.gaierror

    monkeypatch.setattr(public_urls.socket, "getaddrinfo", fail)
    with pytest.raises(public_urls.NonPublicURLError, match="does not resolve"):
        _fetch("https://missing.example/labels.geojson")


def _build_payload(aoi: AOI) -> dict:
    return {
        "title": "Pokhara damage",
        "description": "survey labels",
        "source_imagery": "https://tiles.example/{z}/{x}/{y}.png",
        "category": "buildings",
        "zoom": 19,
        "aoi_ids": [aoi.id],
        "label_tasks": ["semantic-segmentation"],
        "labels_url": "https://example.org/labels.geojson",
        "keywords": ["buildings"],
        "geometry_type": "polygon",
    }


@patch("datasets.views.build_dataset")
def test_build_rejects_a_labels_url_that_is_not_https(mock_task, client, aoi):
    payload = {**_build_payload(aoi), "labels_url": "http://example.org/labels.geojson"}
    response = client.post("/api/v1/datasets/build/", data=payload, format="json")
    assert response.status_code == 400
    assert "labels_url" in response.json()["error"]["details"]
    mock_task.enqueue.assert_not_called()


@patch("datasets.views.build_dataset")
def test_build_rejects_a_labels_url_on_a_private_host(mock_task, client, aoi):
    payload = {**_build_payload(aoi), "labels_url": "https://10.0.0.5/labels.geojson"}
    response = client.post("/api/v1/datasets/build/", data=payload, format="json")
    assert response.status_code == 400
    assert "labels_url" in response.json()["error"]["details"]
    mock_task.enqueue.assert_not_called()


@patch("datasets.views.build_dataset")
def test_build_passes_the_labels_url_and_default_class_property_to_the_task(mock_task, client, aoi):
    response = client.post("/api/v1/datasets/build/", data=_build_payload(aoi), format="json")
    assert response.status_code == 202, response.content
    kwargs = mock_task.enqueue.call_args.kwargs
    assert kwargs["labels_url"] == "https://example.org/labels.geojson"
    assert kwargs["class_property"] == "class"
    assert kwargs["osm_tags"] is None


@pytest.mark.parametrize(
    ("change", "field"),
    [
        ({"osm_tags": {"building": ["*"]}}, "osm_tags"),
        ({"labels_url": None}, "osm_tags"),
        (
            {"labels_url": None, "osm_tags": {"building": ["*"]}, "class_property": "kind"},
            "class_property",
        ),
        ({"labels_url": None, "osm_tags": {"building": []}}, "osm_tags"),
        ({"labels_url": None, "osm_tags": {" ": ["*"]}}, "osm_tags"),
        ({"labels_url": None, "osm_tags": {"k" * 256: ["*"]}}, "osm_tags"),
        ({"class_property": "geometry"}, "class_property"),
        ({"class_property": "bbox"}, "class_property"),
    ],
    ids=[
        "two-sources",
        "no-source",
        "class-property-with-osm",
        "osm-key-without-values",
        "blank-osm-key",
        "long-osm-key",
        "class-property-geometry",
        "class-property-bbox",
    ],
)
@patch("datasets.views.build_dataset")
def test_build_rejects_label_sources_that_do_not_fit(mock_task, client, aoi, change, field):
    payload = {
        key: value for key, value in {**_build_payload(aoi), **change}.items() if value is not None
    }
    response = client.post("/api/v1/datasets/build/", data=payload, format="json")
    assert response.status_code == 400
    assert field in response.json()["error"]["details"]
    mock_task.enqueue.assert_not_called()


def _multipart_payload(aoi: AOI, labels: bytes) -> dict:
    payload = {**_build_payload(aoi), "class_property": "damage"}
    del payload["labels_url"]
    form = {
        key: json.dumps(value) if isinstance(value, list | dict) else value
        for key, value in payload.items()
    }
    return {
        **form,
        "labels_file": SimpleUploadedFile("labels.geojson", labels, "application/geo+json"),
    }


@patch("datasets.views.UPath")
@patch("datasets.views.build_dataset")
def test_build_stores_an_uploaded_labels_file_for_the_task(mock_task, mock_upath, client, aoi):
    collection = {
        "type": "FeatureCollection",
        "features": [_feature(_square(85.502, 27.602), {"damage": "destroyed"})],
    }

    response = client.post(
        "/api/v1/datasets/build/",
        data=_multipart_payload(aoi, json.dumps(collection).encode()),
        format="multipart",
    )

    assert response.status_code == 202, response.content
    kwargs = mock_task.enqueue.call_args.kwargs
    stac_id = Dataset.objects.get(id=kwargs["dataset_id"]).stac_id
    assert kwargs["labels_file_uri"].endswith(f"/datasets/{stac_id}/source/labels")
    assert kwargs["class_property"] == "damage"
    mock_upath.assert_called_once_with(kwargs["labels_file_uri"])
    written = b"".join(
        call.args[0]
        for call in mock_upath.return_value.open.return_value.__enter__.return_value.write.call_args_list
    )
    assert json.loads(written) == collection


def _dataset_with_aoi(user: OsmUser, aoi: AOI) -> Dataset:
    dataset = Dataset.objects.create(
        stac_id="survey",
        title="Survey",
        imagery={"image": "https://t.example/{z}/{x}/{y}"},
        primary_input="image",
        user=user,
    )
    aoi.dataset = dataset
    aoi.save(update_fields=["dataset"])
    return dataset


def _materialize(dataset: Dataset, **sources) -> object:
    with patch("datasets.tasks.write_bundle", return_value={}):
        built, _ = _materialize_dataset_assets(
            dataset,
            zoom=19,
            geometry_type="polygon",
            osm_tags=sources.get("osm_tags"),
            labels_url=sources.get("labels_url"),
            labels_file_uri=sources.get("labels_file_uri"),
            class_property=sources.get("class_property", "class"),
            bundle_dir=Path("unused"),
            imagery_quality="high",
        )
    return built


@patch("datasets.views.build_dataset")
def test_build_rejects_a_geoparquet_upload_over_its_size_cap(
    mock_task, client, aoi, monkeypatch, tmp_path
):
    labels = _geoparquet(tmp_path / "labels.parquet")
    monkeypatch.setattr(label_sources, "LABELS_PARQUET_MAX_BYTES", len(labels) - 1)

    response = client.post(
        "/api/v1/datasets/build/", data=_multipart_payload(aoi, labels), format="multipart"
    )

    assert response.status_code == 400
    assert "labels_file" in response.json()["error"]["details"]
    mock_task.enqueue.assert_not_called()


@patch("geomltoolkits.downloader.osm.download_osm_data")
@patch("datasets.tasks.upload_chips")
@patch("datasets.tasks._download_chips", return_value={"OAM-1-2-19.tif": Path("OAM-1-2-19.tif")})
@patch("datasets.tasks.UPath")
@patch("datasets.tasks.download_labels")
def test_materialize_keeps_the_class_property_of_labels_url_features(
    mock_fetch, mock_upath, mock_download, mock_upload, mock_osm, user, aoi
):
    mock_fetch.side_effect = _serves(
        {
            "type": "FeatureCollection",
            "features": [
                _feature(_square(85.502, 27.602), {"damage": "major-damage", "id": 7}),
                _feature(_square(86.0, 28.0), {"damage": "destroyed"}),
            ],
        }
    )
    labels_file = mock_upath.return_value.__truediv__.return_value

    built = _materialize(
        _dataset_with_aoi(user, aoi),
        labels_url="https://example.org/labels.geojson",
        class_property="damage",
    )

    mock_osm.assert_not_called()
    written = json.loads(labels_file.write_text.call_args.args[0])
    assert [f["properties"] for f in written["features"]] == [{"damage": "major-damage"}]
    assert built.label_properties == ["damage"]
    assert built.label_classes == [{"name": "damage", "classes": ["major-damage"]}]


@patch("datasets.tasks.upload_chips")
@patch("datasets.tasks._download_chips", return_value={"OAM-1-2-19.tif": Path("OAM-1-2-19.tif")})
@patch("datasets.tasks.UPath")
@patch("datasets.tasks.download_labels")
def test_materialize_rejects_labels_without_the_class_property(
    mock_fetch, mock_upath, mock_download, mock_upload, user, aoi
):
    mock_fetch.side_effect = _serves(
        {
            "type": "FeatureCollection",
            "features": [_feature(_square(85.502, 27.602), {"kind": "major-damage"})],
        }
    )

    with pytest.raises(ValueError, match="no 'damage' column"):
        _materialize(
            _dataset_with_aoi(user, aoi),
            labels_url="https://example.org/labels.geojson",
            class_property="damage",
        )


@patch("datasets.tasks.upload_chips")
@patch("datasets.tasks._download_chips", return_value={"OAM-1-2-19.tif": Path("OAM-1-2-19.tif")})
@patch("datasets.tasks.UPath")
def test_materialize_reads_the_uploaded_labels_file(
    mock_upath, mock_download, mock_upload, user, aoi
):
    upload = {
        "type": "FeatureCollection",
        "features": [_feature(_square(85.502, 27.602), {"class": "destroyed"})],
    }
    _upload(mock_upath, json.dumps(upload).encode())

    built = _materialize(
        _dataset_with_aoi(user, aoi),
        labels_file_uri="s3://bucket/datasets/survey/source/labels",
    )

    mock_upath.assert_any_call("s3://bucket/datasets/survey/source/labels")
    assert built.label_classes == [{"name": "class", "classes": ["destroyed"]}]


@patch("geomltoolkits.downloader.osm.download_osm_data")
@patch("datasets.tasks.upload_chips")
@patch("datasets.tasks._download_chips", return_value={"OAM-1-2-19.tif": Path("OAM-1-2-19.tif")})
@patch("datasets.tasks.UPath")
def test_materialize_keeps_matched_osm_tag_keys_beside_the_tags(
    mock_upath, mock_download, mock_upload, mock_osm, user, aoi
):
    building = {
        "osm_id": 1,
        "osm_type": "way",
        "tags": {"building": "house", "roof:material": "tin"},
    }
    road = {"osm_id": 2, "osm_type": "way", "tags": {"highway": "residential"}}

    async def osm(**kwargs):
        return {
            "features": [
                _feature(_square(85.502, 27.602), building),
                _feature(_square(85.504, 27.604), road),
            ]
        }

    mock_osm.side_effect = osm
    labels_file = mock_upath.return_value.__truediv__.return_value

    built = _materialize(_dataset_with_aoi(user, aoi), osm_tags={"building": ["*"]})

    assert mock_osm.call_args.kwargs["filters"] == {
        "tags": {"polygon": {"join_or": {"building": []}}}
    }
    written = json.loads(labels_file.write_text.call_args.args[0])
    assert [f["properties"] for f in written["features"]] == [
        {"building": "house", "tags": {"building": "house", "roof:material": "tin"}}
    ]
    assert built.label_classes == [{"name": "building", "classes": ["house"]}]


@patch("datasets.tasks._download_chips")
@patch(
    "datasets.tasks.download_labels", side_effect=LabelsSourceError("labels_url returned HTTP 404")
)
def test_materialize_fetches_the_labels_url_before_downloading_any_chip(
    mock_fetch, mock_download, user, aoi
):
    with pytest.raises(LabelsSourceError, match="HTTP 404"):
        _materialize(_dataset_with_aoi(user, aoi), labels_url="https://example.org/labels.geojson")

    mock_download.assert_not_called()


@patch("datasets.views.build_dataset")
def test_build_rejects_an_uploaded_labels_file_over_the_size_cap(
    mock_task, client, aoi, monkeypatch
):
    monkeypatch.setattr("datasets.label_sources.LABELS_MAX_BYTES", 10)
    labels = json.dumps({"type": "FeatureCollection", "features": []}).encode()

    response = client.post(
        "/api/v1/datasets/build/", data=_multipart_payload(aoi, labels), format="multipart"
    )

    assert response.status_code == 400
    assert "larger than 10 bytes" in str(response.json()["error"]["details"]["labels_file"])
    mock_task.enqueue.assert_not_called()


@pytest.mark.parametrize(
    "aoi_ids",
    ["1,", "[" * 50000, SimpleUploadedFile("aoi_ids.json", b"1\n2\n3\n")],
    ids=["not-json", "nested-too-deep", "sent-as-a-file"],
)
@patch("datasets.views.build_dataset")
def test_build_rejects_a_form_field_that_is_not_json(mock_task, client, aoi, aoi_ids):
    labels = json.dumps({"type": "FeatureCollection", "features": []}).encode()
    payload = {**_multipart_payload(aoi, labels), "aoi_ids": aoi_ids}

    response = client.post("/api/v1/datasets/build/", data=payload, format="multipart")

    assert response.status_code == 400
    assert len(response.json()["error"]["details"]["aoi_ids"]) == 1
    mock_task.enqueue.assert_not_called()


@patch("datasets.tasks._download_chips")
@patch("datasets.tasks.download_labels")
def test_materialize_checks_the_labels_before_downloading_any_chip(
    mock_fetch, mock_download, user, aoi
):
    mock_fetch.side_effect = _serves(
        {
            "type": "FeatureCollection",
            "features": [_feature(_square(85.502, 27.602), {"kind": "destroyed"})],
        }
    )

    with pytest.raises(ValueError, match="no 'class' column"):
        _materialize(_dataset_with_aoi(user, aoi), labels_url="https://example.org/labels.geojson")

    mock_download.assert_not_called()


@patch("datasets.tasks.UPath")
@patch(
    "datasets.tasks._materialize_dataset_assets",
    side_effect=RuntimeError("no tile has every input"),
)
def test_a_failed_build_removes_the_uploaded_labels_file(mock_materialize, mock_upath, user, aoi):
    from datasets.tasks import build_dataset

    dataset = _dataset_with_aoi(user, aoi)
    uri = "s3://bucket/datasets/survey/source/labels"

    with pytest.raises(RuntimeError):
        build_dataset.call(
            dataset_id=dataset.id,
            description="survey",
            label_tasks=["segmentation"],
            keywords=["building"],
            label_type="vector",
            zoom=19,
            geometry_type="polygon",
            labels_file_uri=uri,
        )

    mock_upath.assert_called_once_with(uri)
    mock_upath.return_value.unlink.assert_called_once_with(missing_ok=True)


@patch("datasets.views.UPath")
@patch("datasets.views.build_dataset")
def test_a_failed_upload_write_leaves_no_dataset(mock_task, mock_upath, client, aoi):
    mock_upath.return_value.open.side_effect = OSError("bucket unreachable")
    labels = json.dumps({"type": "FeatureCollection", "features": []}).encode()

    with pytest.raises(OSError, match="bucket unreachable"):
        client.post(
            "/api/v1/datasets/build/", data=_multipart_payload(aoi, labels), format="multipart"
        )

    aoi.refresh_from_db()
    assert not Dataset.objects.filter(title="Pokhara damage").exists()
    assert aoi.dataset is None
    mock_task.enqueue.assert_not_called()


@patch("datasets.views.UPath")
@patch("datasets.views.build_dataset")
def test_a_failed_enqueue_rolls_back_the_dataset_and_removes_the_upload(
    mock_task, mock_upath, client, aoi
):
    mock_task.enqueue.side_effect = RuntimeError("task table unavailable")
    labels = json.dumps({"type": "FeatureCollection", "features": []}).encode()

    with pytest.raises(RuntimeError, match="task table unavailable"):
        client.post(
            "/api/v1/datasets/build/", data=_multipart_payload(aoi, labels), format="multipart"
        )

    assert not Dataset.objects.filter(title="Pokhara damage").exists()
    mock_upath.return_value.unlink.assert_called_once_with(missing_ok=True)


@patch("datasets.tasks.UPath")
def test_a_build_of_a_missing_dataset_still_removes_the_uploaded_labels_file(mock_upath, db):
    from datasets.tasks import build_dataset

    uri = "s3://bucket/datasets/gone/source/labels.geojson"

    with pytest.raises(Dataset.DoesNotExist):
        build_dataset.call(
            dataset_id=999999,
            description="gone",
            label_tasks=["segmentation"],
            keywords=["building"],
            label_type="vector",
            zoom=19,
            geometry_type="polygon",
            labels_file_uri=uri,
        )

    mock_upath.assert_called_once_with(uri)
    mock_upath.return_value.unlink.assert_called_once_with(missing_ok=True)


def _geoparquet(path: Path) -> bytes:
    frame = gpd.GeoDataFrame({"damage": ["destroyed"]}, geometry=[box(0, 0, 1, 1)], crs="EPSG:4326")
    frame.to_parquet(path, schema_version="1.1.0", write_covering_bbox=True)
    return path.read_bytes()


def test_parquet_labels_get_their_own_size_cap(tmp_path, monkeypatch) -> None:
    monkeypatch.setattr(label_sources, "LABELS_PARQUET_MAX_BYTES", 12345)
    monkeypatch.setattr(label_sources, "LABELS_MAX_BYTES", 10)

    assert label_sources.labels_max_bytes(_geoparquet(tmp_path / "l.parquet")[:4]) == 12345
    assert label_sources.labels_max_bytes(b'{"type"') == 10


@patch("datasets.views.UPath")
@patch("datasets.views.build_dataset")
def test_build_accepts_an_uploaded_geoparquet_labels_file(
    mock_task, mock_upath, client, aoi, tmp_path
):
    labels = _geoparquet(tmp_path / "labels.parquet")

    response = client.post(
        "/api/v1/datasets/build/", data=_multipart_payload(aoi, labels), format="multipart"
    )

    assert response.status_code == 202, response.content
    handle = mock_upath.return_value.open.return_value.__enter__.return_value
    assert b"".join(call.args[0] for call in handle.write.call_args_list) == labels


@patch("datasets.tasks.upload_chips")
@patch("datasets.tasks._download_chips", return_value={"OAM-1-2-19.tif": Path("OAM-1-2-19.tif")})
@patch("datasets.tasks.UPath")
def test_materialize_reads_geoparquet_labels_inside_the_aoi_only(
    mock_upath, mock_download, mock_upload, user, aoi, tmp_path
):
    frame = gpd.GeoDataFrame(
        {"class": ["destroyed", "far"]},
        geometry=[shape(_square(85.502, 27.602)), shape(_square(86.0, 28.0))],
        crs="EPSG:4326",
    )
    frame.to_parquet(tmp_path / "labels.parquet", schema_version="1.1.0", write_covering_bbox=True)
    _upload(mock_upath, (tmp_path / "labels.parquet").read_bytes())

    built = _materialize(_dataset_with_aoi(user, aoi), labels_file_uri="s3://b/source/labels")

    assert built.label_classes == [{"name": "class", "classes": ["destroyed"]}]


@patch("datasets.tasks.upload_chips")
@patch("datasets.tasks._download_chips", return_value={"OAM-1-2-19.tif": Path("OAM-1-2-19.tif")})
@patch("datasets.tasks.UPath")
def test_materialize_writes_a_timestamp_class_as_text(
    mock_upath, mock_download, mock_upload, user, aoi, tmp_path
):
    frame = gpd.GeoDataFrame(
        {"class": pd.to_datetime(["2024-05-01"])},
        geometry=[shape(_square(85.502, 27.602))],
        crs="EPSG:4326",
    )
    frame.to_parquet(tmp_path / "labels.parquet")
    _upload(mock_upath, (tmp_path / "labels.parquet").read_bytes())

    built = _materialize(_dataset_with_aoi(user, aoi), labels_file_uri="s3://b/source/labels")

    assert built.label_classes == [{"name": "class", "classes": ["2024-05-01"]}]


@patch("datasets.tasks.upload_chips")
@patch(
    "datasets.tasks._download_chips",
    return_value={"OAM-1-2-19.tif": Path("OAM-1-2-19.tif"), "OAM-1-2-19.tif.aux.xml": Path("x")},
)
@patch("datasets.tasks.UPath")
@patch("datasets.tasks.download_labels")
def test_materialize_hands_the_downloaded_chips_and_label_properties_to_the_bundle(
    mock_fetch, mock_upath, mock_download, mock_upload, user, aoi
):
    mock_fetch.side_effect = _serves(
        {
            "type": "FeatureCollection",
            "features": [_feature(_square(85.502, 27.602), {"damage": "minor"})],
        }
    )

    with patch("datasets.tasks.write_bundle", return_value={"labels_parquet": Path("l")}) as write:
        _, bundle = _materialize_dataset_assets(
            _dataset_with_aoi(user, aoi),
            zoom=19,
            geometry_type="polygon",
            osm_tags=None,
            labels_url="https://example.org/labels.geojson",
            labels_file_uri=None,
            class_property="damage",
            bundle_dir=Path("out"),
            imagery_quality="lossless",
        )

    chips_by_input, features, properties, out, quality = write.call_args.args
    assert quality == "lossless"
    assert chips_by_input == {"image": {"OAM-1-2-19": Path("OAM-1-2-19.tif")}}
    assert (properties, out) == (["damage"], Path("out"))
    assert [f["properties"] for f in features] == [{"damage": "minor"}]
    assert bundle == {"labels_parquet": Path("l")}


@pytest.mark.parametrize(
    ("sent", "queued"), [({}, "high"), ({"imagery_quality": "lossless"}, "lossless")]
)
@patch("datasets.views.build_dataset")
def test_build_queues_the_imagery_quality(mock_task, client, aoi, sent, queued):
    response = client.post(
        "/api/v1/datasets/build/", data={**_build_payload(aoi), **sent}, format="json"
    )

    assert response.status_code == 202, response.content
    assert mock_task.enqueue.call_args.kwargs["imagery_quality"] == queued


@pytest.mark.parametrize("quality", [90, "low"])
@patch("datasets.views.build_dataset")
def test_build_rejects_an_unknown_imagery_quality(mock_task, client, aoi, quality):
    response = client.post(
        "/api/v1/datasets/build/",
        data={**_build_payload(aoi), "imagery_quality": quality},
        format="json",
    )

    assert response.status_code == 400
    assert "imagery_quality" in response.json()["error"]["details"]
    mock_task.enqueue.assert_not_called()


def _memory_fs(path: str, body: bytes) -> fsspec.AbstractFileSystem:
    filesystem = fsspec.filesystem("memory", skip_instance_cache=True)
    filesystem.pipe(path, body)
    return filesystem


def _serves(collection: dict):
    return lambda url, target: target.write_text(json.dumps(collection))


def _fetch(url: str) -> bytes:
    with tempfile.TemporaryDirectory() as tmp:
        target = Path(tmp) / "labels"
        download_labels(url, target)
        return target.read_bytes()


def _upload(mock_upath, body: bytes) -> None:
    mock_upath.return_value.read_bytes.return_value = body


class _LabelsHandler(http.server.BaseHTTPRequestHandler):
    routes: dict[str, tuple[int, dict[str, str], bytes]] = {}
    requested: list[str] = []

    def _answer(self, with_body: bool) -> None:
        self.requested.append(self.path)
        status, headers, body = self.routes[self.path]
        if self.path == "/slow":
            time.sleep(1)
        if with_body and (wanted := self.headers.get("Range")):
            start, end = (int(part) for part in wanted.removeprefix("bytes=").split("-"))
            status, body = 206, body[start : end + 1]
        self.send_response(status)
        for name, value in headers.items():
            self.send_header(name, value)
        if "Connection" not in headers:
            self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        if with_body:
            self.wfile.write(body)
        while with_body and self.path == "/endless":
            try:
                self.wfile.write(b" " * 2**20)
            except (BrokenPipeError, ConnectionResetError):
                return

    def do_HEAD(self) -> None:
        self._answer(with_body=False)

    def do_GET(self) -> None:
        self._answer(with_body=True)

    def log_message(self, *args) -> None:
        return


@pytest.fixture
def labels_server(monkeypatch):
    checked: list[str] = []

    def check(url: str, schemes: tuple[str, ...]) -> None:
        checked.append(url)
        if "/private" in url:
            raise public_urls.NonPublicURLError(f"host of {url!r} resolves to a non-public address")

    monkeypatch.setattr(label_sources, "require_public_url", check)
    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), _LabelsHandler)
    _LabelsHandler.routes = {}
    _LabelsHandler.requested = []
    threading.Thread(target=server.serve_forever, daemon=True).start()
    yield SimpleNamespace(
        url=f"http://127.0.0.1:{server.server_port}",
        routes=_LabelsHandler.routes,
        requested=_LabelsHandler.requested,
        checked=checked,
    )
    server.shutdown()
    server.server_close()


def test_a_labels_url_is_read_after_its_redirects_are_checked(labels_server):
    labels_server.routes["/labels.geojson"] = (302, {"Location": "/cdn/labels.geojson"}, b"")
    labels_server.routes["/cdn/labels.geojson"] = (200, {}, b'{"type": "FeatureCollection"}')

    assert _fetch(f"{labels_server.url}/labels.geojson").startswith(b'{"type"')
    assert f"{labels_server.url}/cdn/labels.geojson" in labels_server.checked


def test_a_labels_url_redirecting_to_a_private_host_is_never_requested(labels_server):
    labels_server.routes["/labels.geojson"] = (302, {"Location": "/private/metadata"}, b"")
    labels_server.routes["/private/metadata"] = (200, {}, b"secret")

    with pytest.raises(public_urls.NonPublicURLError, match="non-public"):
        _fetch(f"{labels_server.url}/labels.geojson")

    assert "/private/metadata" not in labels_server.requested


def test_a_labels_url_stops_after_too_many_redirects(labels_server):
    labels_server.routes["/loop"] = (302, {"Location": "/loop"}, b"")

    with pytest.raises(aiohttp.TooManyRedirects):
        _fetch(f"{labels_server.url}/loop")


@pytest.mark.parametrize(("hops", "follows"), [(5, True), (6, False)])
def test_a_labels_url_follows_up_to_five_redirects(labels_server, hops, follows):
    for hop in range(hops):
        labels_server.routes[f"/hop{hop}"] = (302, {"Location": f"/hop{hop + 1}"}, b"")
    labels_server.routes[f"/hop{hops}"] = (200, {}, b"{}")

    if follows:
        assert _fetch(f"{labels_server.url}/hop0") == b"{}"
    else:
        with pytest.raises(aiohttp.TooManyRedirects):
            _fetch(f"{labels_server.url}/hop0")


def test_a_slow_labels_url_times_out(labels_server, monkeypatch):
    monkeypatch.setattr(label_sources, "LABELS_URL_TIMEOUT_SECONDS", 0.2)
    labels_server.routes["/slow"] = (200, {}, b"{}")

    with pytest.raises(TimeoutError):
        _fetch(f"{labels_server.url}/slow")


@pytest.mark.parametrize(
    ("name", "body"),
    [("labels.geojson", b"{" + b" " * 20), ("labels.parquet", b"PAR1" + b"0" * 20)],
)
def test_a_labels_url_over_its_size_cap_is_refused(
    labels_server, monkeypatch, name, body
):
    monkeypatch.setattr(label_sources, "LABELS_MAX_BYTES", 10)
    monkeypatch.setattr(label_sources, "LABELS_PARQUET_MAX_BYTES", 10)
    labels_server.routes[f"/{name}"] = (200, {}, body)

    with pytest.raises(LabelsSourceError, match="larger than 10 bytes"):
        _fetch(f"{labels_server.url}/{name}")


def test_a_geoparquet_url_gets_the_larger_cap(labels_server, monkeypatch):
    monkeypatch.setattr(label_sources, "LABELS_MAX_BYTES", 10)
    monkeypatch.setattr(label_sources, "LABELS_PARQUET_MAX_BYTES", 100)
    labels_server.routes["/labels.parquet"] = (200, {}, b"PAR1" + b"0" * 20)

    assert len(_fetch(f"{labels_server.url}/labels.parquet")) == 24


@pytest.mark.parametrize(
    ("body", "message"),
    [(b"not json", "neither GeoParquet nor GeoJSON"), (b"PAR1 plain parquet", "Parquet")],
    ids=["not-geojson", "not-geoparquet"],
)
@patch("datasets.tasks._download_chips")
@patch("datasets.tasks.UPath")
def test_an_unreadable_labels_upload_fails_the_build_before_any_chip(
    mock_upath, mock_download, user, aoi, body, message
):
    _upload(mock_upath, body)

    with pytest.raises(ValueError, match=message):
        _materialize(_dataset_with_aoi(user, aoi), labels_file_uri="s3://b/source/labels")

    mock_download.assert_not_called()


@patch("datasets.views.UPath")
@patch("datasets.views.build_dataset")
def test_an_upload_is_queued_without_reading_its_contents(mock_task, mock_upath, client, aoi):
    response = client.post(
        "/api/v1/datasets/build/", data=_multipart_payload(aoi, b"not json"), format="multipart"
    )

    assert response.status_code == 202, response.content
    mock_task.enqueue.assert_called_once()


def test_an_endless_labels_url_is_stopped_at_the_cap(labels_server, monkeypatch):
    monkeypatch.setattr(label_sources, "LABELS_MAX_BYTES", 10)
    monkeypatch.setattr(label_sources, "LABELS_PARQUET_MAX_BYTES", 10)
    monkeypatch.setattr(label_sources, "LABELS_URL_TIMEOUT_SECONDS", 10)
    labels_server.routes["/endless"] = (200, {"Connection": "close"}, b"{")

    with pytest.raises(LabelsSourceError, match="larger than 10 bytes"):
        _fetch(f"{labels_server.url}/endless")


def test_a_geojson_url_over_its_own_cap_is_refused_under_the_parquet_cap(
    labels_server, monkeypatch
):
    monkeypatch.setattr(label_sources, "LABELS_MAX_BYTES", 10)
    monkeypatch.setattr(label_sources, "LABELS_PARQUET_MAX_BYTES", 100)
    labels_server.routes["/labels.geojson"] = (200, {}, b"{" + b" " * 20)

    with pytest.raises(LabelsSourceError, match="larger than 10 bytes"):
        _fetch(f"{labels_server.url}/labels.geojson")
