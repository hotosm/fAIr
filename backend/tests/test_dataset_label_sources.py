import json
import socket
from pathlib import Path
from unittest.mock import patch

import httpx
import pytest
from django.contrib.gis.geos import Polygon
from django.core.files.uploadedfile import SimpleUploadedFile

from accounts.models import OsmUser
from datasets import label_sources
from datasets.label_sources import LabelsSourceError, fetch_labels_geojson, parse_labels_geojson
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


def _serve(monkeypatch, handler) -> None:
    client = httpx.Client(transport=httpx.MockTransport(handler))
    monkeypatch.setattr(label_sources.httpx, "stream", client.stream)


def test_fetch_rejects_a_non_https_url():
    with pytest.raises(public_urls.NonPublicURLError, match="https"):
        fetch_labels_geojson("http://example.org/labels.geojson")


def test_fetch_rejects_a_host_that_resolves_to_a_private_address():
    with pytest.raises(public_urls.NonPublicURLError, match="non-public"):
        fetch_labels_geojson("https://127.0.0.1/labels.geojson")


def test_fetch_rejects_a_nat64_address(monkeypatch):
    monkeypatch.setattr(
        public_urls.socket,
        "getaddrinfo",
        lambda host, port, type: [(socket.AF_INET6, type, 6, "", ("64:ff9b::7f00:1", port, 0, 0))],
    )
    with pytest.raises(public_urls.NonPublicURLError, match="non-public"):
        fetch_labels_geojson("https://example.org/labels.geojson")


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
def test_fetch_rejects_hosts_with_any_non_public_address(monkeypatch, addresses):
    monkeypatch.setattr(
        public_urls.socket,
        "getaddrinfo",
        lambda host, port, type: [(family, type, 6, "", (ip, port)) for family, ip in addresses],
    )
    with pytest.raises(public_urls.NonPublicURLError, match="non-public"):
        fetch_labels_geojson("https://example.org/labels.geojson")


def test_fetch_checks_the_idna_host_that_httpx_connects_to(monkeypatch):
    checked = []

    def resolve(host, port, type):
        checked.append(host)
        return [(socket.AF_INET, type, 6, "", ("10.0.0.5", port))]

    monkeypatch.setattr(public_urls.socket, "getaddrinfo", resolve)
    with pytest.raises(public_urls.NonPublicURLError, match="non-public"):
        fetch_labels_geojson("https://bücher.example/labels.geojson")
    assert checked == ["xn--bcher-kva.example"]


def test_fetch_rejects_a_host_that_does_not_resolve(monkeypatch):
    def fail(*args, **kwargs):
        raise socket.gaierror

    monkeypatch.setattr(public_urls.socket, "getaddrinfo", fail)
    with pytest.raises(public_urls.NonPublicURLError, match="does not resolve"):
        fetch_labels_geojson("https://missing.example/labels.geojson")


def test_fetch_stops_a_download_that_runs_past_the_time_cap(monkeypatch):
    monkeypatch.setattr(label_sources, "LABELS_URL_TOTAL_SECONDS", -1)
    _serve(monkeypatch, lambda request: httpx.Response(200, content=b"{}"))
    with pytest.raises(LabelsSourceError, match="took longer than"):
        fetch_labels_geojson("https://example.org/labels.geojson")


def test_fetch_returns_a_feature_collection(monkeypatch):
    collection = {"type": "FeatureCollection", "features": [_feature(_square(85.5, 27.6), {})]}
    _serve(monkeypatch, lambda request: httpx.Response(200, json=collection))
    assert fetch_labels_geojson("https://example.org/labels.geojson") == collection


def test_fetch_follows_a_redirect_to_a_public_https_host(monkeypatch):
    collection = {"type": "FeatureCollection", "features": [_feature(_square(85.5, 27.6), {})]}

    def handler(request: httpx.Request) -> httpx.Response:
        if request.url.path == "/labels.geojson":
            return httpx.Response(307, headers={"Location": "https://example.com/cdn/labels.geojson"})
        return httpx.Response(200, json=collection)

    _serve(monkeypatch, handler)
    assert fetch_labels_geojson("https://example.org/labels.geojson") == collection


def test_fetch_rejects_a_redirect_to_a_private_host(monkeypatch):
    _serve(
        monkeypatch,
        lambda request: httpx.Response(302, headers={"Location": "https://169.254.169.254/"}),
    )
    with pytest.raises(public_urls.NonPublicURLError, match="non-public"):
        fetch_labels_geojson("https://example.org/labels.geojson")


def test_fetch_stops_after_too_many_redirects(monkeypatch):
    _serve(
        monkeypatch,
        lambda request: httpx.Response(302, headers={"Location": "https://example.org/again"}),
    )
    with pytest.raises(LabelsSourceError, match="redirected more than 5 times"):
        fetch_labels_geojson("https://example.org/labels.geojson")


def test_fetch_rejects_a_body_over_the_size_cap(monkeypatch):
    monkeypatch.setattr(label_sources, "LABELS_MAX_BYTES", 10)
    _serve(monkeypatch, lambda request: httpx.Response(200, content=b"x" * 11))
    with pytest.raises(LabelsSourceError, match="larger than 10 bytes"):
        fetch_labels_geojson("https://example.org/labels.geojson")


def test_fetch_rejects_json_that_is_not_a_feature_collection(monkeypatch):
    _serve(monkeypatch, lambda request: httpx.Response(200, json={"type": "Feature"}))
    with pytest.raises(LabelsSourceError, match="FeatureCollection"):
        fetch_labels_geojson("https://example.org/labels.geojson")


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
        ({"labels_url": None, "osm_tags": {"building": ["*"]}, "class_property": "kind"}, "class_property"),
        ({"labels_url": None, "osm_tags": {"building": []}}, "osm_tags"),
        ({"labels_url": None, "osm_tags": {" ": ["*"]}}, "osm_tags"),
        ({"labels_url": None, "osm_tags": {"k" * 256: ["*"]}}, "osm_tags"),
    ],
    ids=[
        "two-sources",
        "no-source",
        "class-property-with-osm",
        "osm-key-without-values",
        "blank-osm-key",
        "long-osm-key",
    ],
)
@patch("datasets.views.build_dataset")
def test_build_rejects_label_sources_that_do_not_fit(mock_task, client, aoi, change, field):
    payload = {key: value for key, value in {**_build_payload(aoi), **change}.items() if value is not None}
    response = client.post("/api/v1/datasets/build/", data=payload, format="json")
    assert response.status_code == 400
    assert field in response.json()["error"]["details"]
    mock_task.enqueue.assert_not_called()


def _multipart_payload(aoi: AOI, labels: bytes) -> dict:
    payload = {**_build_payload(aoi), "class_property": "damage"}
    del payload["labels_url"]
    form = {key: json.dumps(value) if isinstance(value, list | dict) else value for key, value in payload.items()}
    return {**form, "labels_file": SimpleUploadedFile("labels.geojson", labels, "application/geo+json")}


@patch("datasets.views.UPath")
@patch("datasets.views.build_dataset")
def test_build_stores_an_uploaded_labels_file_for_the_task(mock_task, mock_upath, client, aoi):
    collection = {"type": "FeatureCollection", "features": [_feature(_square(85.502, 27.602), {"damage": "destroyed"})]}

    response = client.post(
        "/api/v1/datasets/build/",
        data=_multipart_payload(aoi, json.dumps(collection).encode()),
        format="multipart",
    )

    assert response.status_code == 202, response.content
    kwargs = mock_task.enqueue.call_args.kwargs
    stac_id = Dataset.objects.get(id=kwargs["dataset_id"]).stac_id
    assert kwargs["labels_file_uri"].endswith(f"/datasets/{stac_id}/source/labels.geojson")
    assert kwargs["class_property"] == "damage"
    mock_upath.assert_called_once_with(kwargs["labels_file_uri"])
    written = b"".join(call.args[0] for call in mock_upath.return_value.open.return_value.__enter__.return_value.write.call_args_list)
    assert json.loads(written) == collection


@pytest.mark.parametrize(
    "labels",
    [b"not json", json.dumps({"type": "Feature"}).encode()],
    ids=["invalid-json", "not-a-feature-collection"],
)
@patch("datasets.views.build_dataset")
def test_build_rejects_an_uploaded_labels_file_that_is_not_a_feature_collection(mock_task, client, aoi, labels):
    response = client.post("/api/v1/datasets/build/", data=_multipart_payload(aoi, labels), format="multipart")
    assert response.status_code == 400
    assert "labels_file" in response.json()["error"]["details"]
    mock_task.enqueue.assert_not_called()


def _dataset_with_aoi(user: OsmUser, aoi: AOI) -> Dataset:
    dataset = Dataset.objects.create(
        stac_id="survey", title="Survey", imagery={"image": "https://t.example/{z}/{x}/{y}"}, primary_input="image", user=user
    )
    aoi.dataset = dataset
    aoi.save(update_fields=["dataset"])
    return dataset


def _materialize(dataset: Dataset, **sources) -> object:
    return _materialize_dataset_assets(
        dataset,
        zoom=19,
        geometry_type="polygon",
        osm_tags=sources.get("osm_tags"),
        labels_url=sources.get("labels_url"),
        labels_file_uri=sources.get("labels_file_uri"),
        class_property=sources.get("class_property", "class"),
    )


@patch("geomltoolkits.downloader.osm.download_osm_data")
@patch("datasets.tasks.upload_chips")
@patch("datasets.tasks._download_chips", return_value={"OAM-1-2-19.tif": Path("OAM-1-2-19.tif")})
@patch("datasets.tasks.UPath")
@patch("datasets.tasks.fetch_labels_geojson")
def test_materialize_keeps_the_class_property_of_labels_url_features(
    mock_fetch, mock_upath, mock_download, mock_upload, mock_osm, user, aoi
):
    mock_fetch.return_value = {
        "type": "FeatureCollection",
        "features": [
            _feature(_square(85.502, 27.602), {"damage": "major-damage", "id": 7}),
            _feature(_square(86.0, 28.0), {"damage": "destroyed"}),
        ],
    }
    labels_file = mock_upath.return_value.__truediv__.return_value

    built = _materialize(
        _dataset_with_aoi(user, aoi), labels_url="https://example.org/labels.geojson", class_property="damage"
    )

    mock_osm.assert_not_called()
    written = json.loads(labels_file.write_text.call_args.args[0])
    assert [f["properties"] for f in written["features"]] == [{"damage": "major-damage"}]
    assert built.label_properties == ["damage"]
    assert built.label_classes == [{"name": "damage", "classes": ["major-damage"]}]


@patch("datasets.tasks.upload_chips")
@patch("datasets.tasks._download_chips", return_value={"OAM-1-2-19.tif": Path("OAM-1-2-19.tif")})
@patch("datasets.tasks.UPath")
@patch("datasets.tasks.fetch_labels_geojson")
def test_materialize_rejects_labels_without_the_class_property(
    mock_fetch, mock_upath, mock_download, mock_upload, user, aoi
):
    mock_fetch.return_value = {
        "type": "FeatureCollection",
        "features": [_feature(_square(85.502, 27.602), {"kind": "major-damage"})],
    }

    with pytest.raises(ValueError, match="no 'damage' property"):
        _materialize(
            _dataset_with_aoi(user, aoi), labels_url="https://example.org/labels.geojson", class_property="damage"
        )


@patch("datasets.tasks.upload_chips")
@patch("datasets.tasks._download_chips", return_value={"OAM-1-2-19.tif": Path("OAM-1-2-19.tif")})
@patch("datasets.tasks.UPath")
def test_materialize_reads_the_uploaded_labels_file(mock_upath, mock_download, mock_upload, user, aoi):
    upload = {"type": "FeatureCollection", "features": [_feature(_square(85.502, 27.602), {"class": "destroyed"})]}
    mock_upath.return_value.read_bytes.return_value = json.dumps(upload).encode()

    built = _materialize(_dataset_with_aoi(user, aoi), labels_file_uri="s3://bucket/datasets/survey/source/labels.geojson")

    mock_upath.assert_any_call("s3://bucket/datasets/survey/source/labels.geojson")
    assert built.label_classes == [{"name": "class", "classes": ["destroyed"]}]


@patch("geomltoolkits.downloader.osm.download_osm_data")
@patch("datasets.tasks.upload_chips")
@patch("datasets.tasks._download_chips", return_value={"OAM-1-2-19.tif": Path("OAM-1-2-19.tif")})
@patch("datasets.tasks.UPath")
def test_materialize_keeps_matched_osm_tag_keys_beside_the_tags(
    mock_upath, mock_download, mock_upload, mock_osm, user, aoi
):
    building = {"osm_id": 1, "osm_type": "way", "tags": {"building": "house", "roof:material": "tin"}}
    road = {"osm_id": 2, "osm_type": "way", "tags": {"highway": "residential"}}

    async def osm(**kwargs):
        return {"features": [_feature(_square(85.502, 27.602), building), _feature(_square(85.504, 27.604), road)]}

    mock_osm.side_effect = osm
    labels_file = mock_upath.return_value.__truediv__.return_value

    built = _materialize(_dataset_with_aoi(user, aoi), osm_tags={"building": ["*"]})

    assert mock_osm.call_args.kwargs["filters"] == {"tags": {"polygon": {"join_or": {"building": []}}}}
    written = json.loads(labels_file.write_text.call_args.args[0])
    assert [f["properties"] for f in written["features"]] == [
        {"building": "house", "tags": {"building": "house", "roof:material": "tin"}}
    ]
    assert built.label_classes == [{"name": "building", "classes": ["house"]}]


@patch("datasets.tasks._download_chips")
@patch("datasets.tasks.fetch_labels_geojson", side_effect=LabelsSourceError("labels_url returned HTTP 404"))
def test_materialize_fetches_the_labels_url_before_downloading_any_chip(mock_fetch, mock_download, user, aoi):
    with pytest.raises(LabelsSourceError, match="HTTP 404"):
        _materialize(_dataset_with_aoi(user, aoi), labels_url="https://example.org/labels.geojson")

    mock_download.assert_not_called()


@patch("datasets.views.build_dataset")
def test_build_rejects_an_uploaded_labels_file_over_the_size_cap(mock_task, client, aoi, monkeypatch):
    monkeypatch.setattr("datasets.serializers.LABELS_MAX_BYTES", 10)
    labels = json.dumps({"type": "FeatureCollection", "features": []}).encode()

    response = client.post("/api/v1/datasets/build/", data=_multipart_payload(aoi, labels), format="multipart")

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
@patch("datasets.tasks.fetch_labels_geojson")
def test_materialize_checks_the_labels_before_downloading_any_chip(mock_fetch, mock_download, user, aoi):
    mock_fetch.return_value = {
        "type": "FeatureCollection",
        "features": [_feature(_square(85.502, 27.602), {"kind": "destroyed"})],
    }

    with pytest.raises(ValueError, match="no 'class' property"):
        _materialize(_dataset_with_aoi(user, aoi), labels_url="https://example.org/labels.geojson")

    mock_download.assert_not_called()


@patch("datasets.tasks.UPath")
@patch("datasets.tasks._materialize_dataset_assets", side_effect=RuntimeError("no tile has every input"))
def test_a_failed_build_removes_the_uploaded_labels_file(mock_materialize, mock_upath, user, aoi):
    from datasets.tasks import build_dataset

    dataset = _dataset_with_aoi(user, aoi)
    uri = "s3://bucket/datasets/survey/source/labels.geojson"

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


@pytest.mark.parametrize("body", [b"[" * 50000, b"\x89PNG\r\n"], ids=["nested-too-deep", "not-utf-8"])
def test_labels_that_are_not_json_are_rejected(body):
    with pytest.raises(LabelsSourceError, match="not valid JSON"):
        parse_labels_geojson(body)


@patch("datasets.views.UPath")
@patch("datasets.views.build_dataset")
def test_a_failed_upload_write_leaves_no_dataset(mock_task, mock_upath, client, aoi):
    mock_upath.return_value.open.side_effect = OSError("bucket unreachable")
    labels = json.dumps({"type": "FeatureCollection", "features": []}).encode()

    with pytest.raises(OSError, match="bucket unreachable"):
        client.post("/api/v1/datasets/build/", data=_multipart_payload(aoi, labels), format="multipart")

    aoi.refresh_from_db()
    assert not Dataset.objects.filter(title="Pokhara damage").exists()
    assert aoi.dataset is None
    mock_task.enqueue.assert_not_called()


@patch("datasets.views.UPath")
@patch("datasets.views.build_dataset")
def test_a_failed_enqueue_rolls_back_the_dataset_and_removes_the_upload(mock_task, mock_upath, client, aoi):
    mock_task.enqueue.side_effect = RuntimeError("task table unavailable")
    labels = json.dumps({"type": "FeatureCollection", "features": []}).encode()

    with pytest.raises(RuntimeError, match="task table unavailable"):
        client.post("/api/v1/datasets/build/", data=_multipart_payload(aoi, labels), format="multipart")

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
