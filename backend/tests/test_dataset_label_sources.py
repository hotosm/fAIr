import json
import socket
from pathlib import Path
from unittest.mock import patch

import httpx
import pytest
from django.contrib.gis.geos import Polygon
from rest_framework.test import APIClient

from accounts.models import OsmUser
from datasets import label_sources
from datasets.label_sources import LabelsSourceError, fetch_labels_geojson
from datasets.models import AOI, Dataset
from datasets.tasks import _build_osm_filters, _materialize_dataset_assets, _stamp_source_labels
from shared import public_urls

DAMAGE_CLASSES = [
    {"name": "damage", "classes": ["no-damage"]},
    {"name": "damage", "classes": ["minor-damage"]},
    {"name": "damage", "classes": ["major-damage"]},
    {"name": "damage", "classes": ["destroyed"]},
]
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
def user(db) -> OsmUser:
    return OsmUser.objects.create(osm_id=2001, username="surveyor")


@pytest.fixture
def client(user: OsmUser) -> APIClient:
    api = APIClient()
    api.force_authenticate(user=user)
    return api


@pytest.fixture
def aoi(user: OsmUser) -> AOI:
    return AOI.objects.create(geom=AOI_POLYGON, user=user)


def _serve(monkeypatch, handler) -> None:
    client = httpx.Client(transport=httpx.MockTransport(handler))
    monkeypatch.setattr(label_sources.httpx, "stream", client.stream)


def test_osm_filters_request_every_value_of_a_repeated_key():
    filters = _build_osm_filters(DAMAGE_CLASSES, "polygon")
    assert filters["tags"]["polygon"]["join_or"] == {
        "damage": ["no-damage", "minor-damage", "major-damage", "destroyed"]
    }


def test_osm_filters_wildcard_on_a_repeated_key_requests_any_value():
    label_classes = [
        {"name": "building", "classes": ["school"]},
        {"name": "building", "classes": ["*"]},
    ]
    assert _build_osm_filters(label_classes, "polygon")["tags"]["polygon"]["join_or"] == {
        "building": []
    }


def test_osm_filters_wildcard_first_on_a_key_keeps_any_value():
    label_classes = [
        {"name": "building", "classes": ["*"]},
        {"name": "building", "classes": ["school"]},
    ]
    assert _build_osm_filters(label_classes, "polygon")["tags"]["polygon"]["join_or"] == {
        "building": []
    }


def test_source_labels_keep_matching_features_inside_the_aois():
    inside_destroyed = _feature(_square(85.502, 27.602), {"damage": "destroyed"})
    inside_minor = _feature(_square(85.504, 27.604), {"damage": "minor-damage", "id": 7})
    outside = _feature(_square(86.0, 28.0), {"damage": "destroyed"})
    unknown_value = _feature(_square(85.506, 27.606), {"damage": "partial"})
    no_properties = _feature(_square(85.507, 27.607), None)
    point = _feature({"type": "Point", "coordinates": [85.505, 27.605]}, {"damage": "destroyed"})

    features, dropped = _stamp_source_labels(
        [inside_destroyed, inside_minor, outside, unknown_value, no_properties, point],
        AOI_POLYGON,
        DAMAGE_CLASSES,
        "polygon",
    )

    assert [f["properties"] for f in features] == [
        {"damage": "destroyed", "label": 4},
        {"damage": "minor-damage", "id": 7, "label": 2},
    ]
    assert dropped == 4


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
    monkeypatch.setattr(label_sources, "LABELS_URL_MAX_BYTES", 10)
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
        "label_classes": DAMAGE_CLASSES,
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
def test_build_passes_the_labels_url_to_the_task(mock_task, client, aoi):
    response = client.post("/api/v1/datasets/build/", data=_build_payload(aoi), format="json")
    assert response.status_code == 202, response.content
    assert mock_task.enqueue.call_args.kwargs["labels_url"] == "https://example.org/labels.geojson"


@patch("geomltoolkits.downloader.osm.download_osm_data")
@patch("datasets.tasks.upload_chips")
@patch("datasets.tasks._download_chips", return_value={"OAM-1-2-19.tif": Path("OAM-1-2-19.tif")})
@patch("datasets.tasks.UPath")
@patch("datasets.tasks.fetch_labels_geojson")
def test_materialize_labels_from_the_labels_url_without_calling_osm(
    mock_fetch, mock_upath, mock_download, mock_upload, mock_osm, user, aoi
):
    dataset = Dataset.objects.create(
        stac_id="survey", title="Survey", imagery={"image": "https://t.example/{z}/{x}/{y}"}, primary_input="image", user=user
    )
    aoi.dataset = dataset
    aoi.save(update_fields=["dataset"])
    mock_fetch.return_value = {
        "type": "FeatureCollection",
        "features": [_feature(_square(85.502, 27.602), {"damage": "major-damage"})],
    }
    labels_file = mock_upath.return_value.__truediv__.return_value

    _materialize_dataset_assets(
        dataset,
        zoom=19,
        label_classes=DAMAGE_CLASSES,
        geometry_type="polygon",
        labels_url="https://example.org/labels.geojson",
    )

    mock_osm.assert_not_called()
    mock_fetch.assert_called_once_with("https://example.org/labels.geojson")
    written = json.loads(labels_file.write_text.call_args.args[0])
    assert [f["properties"] for f in written["features"]] == [{"damage": "major-damage", "label": 3}]


@patch("datasets.tasks._download_chips")
@patch("datasets.tasks.fetch_labels_geojson", side_effect=LabelsSourceError("labels_url returned HTTP 404"))
def test_materialize_fetches_the_labels_url_before_downloading_any_chip(mock_fetch, mock_download, user, aoi):
    dataset = Dataset.objects.create(
        stac_id="survey", title="Survey", imagery={"image": "https://t.example/{z}/{x}/{y}"}, primary_input="image", user=user
    )
    aoi.dataset = dataset
    aoi.save(update_fields=["dataset"])

    with pytest.raises(LabelsSourceError, match="HTTP 404"):
        _materialize_dataset_assets(
            dataset,
            zoom=19,
            label_classes=DAMAGE_CLASSES,
            geometry_type="polygon",
            labels_url="https://example.org/labels.geojson",
        )

    mock_download.assert_not_called()
