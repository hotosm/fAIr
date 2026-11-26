import io
import shutil
import uuid
from datetime import timedelta
from pathlib import Path
from unittest.mock import MagicMock, patch

import geopandas as gpd
import mercantile
import numpy as np
import pandas as pd
import pytest
import rasterio
from django.contrib.admin import AdminSite
from django.core.cache import cache
from django.test import override_settings
from django.utils import timezone
from django_tasks_db.models import DBTaskResult
from pmtiles.reader import Reader
from pmtiles.tile import zxy_to_tileid
from rasterio.transform import from_bounds
from rest_framework.test import APIClient
from shapely.geometry import box
from upath import UPath

from accounts.models import OsmUser
from datasets.models import Dataset
from predictions.models import Prediction
from shared.storage import StoragePaths
from validation import tasks
from validation.admin import ValidationProjectAdmin
from validation.models import ValidationAnswer, ValidationProject
from validation.serializers import MAX_TILE_ID, ValidationProjectSerializer
from validation.throttles import GuestAnswerRateThrottle, GuestReadRateThrottle

URL = "/api/v1/validation/projects/"
TILE = zxy_to_tileid(19, 233651, 245320)


def _dataset(
    user: OsmUser,
    stac_id: str = "freetown",
    status: str = Dataset.Status.BUILT,
    visibility: str = "private",
    imagery: dict | None = None,
) -> Dataset:
    imagery = imagery or {"image": "https://tiles.example/{z}/{x}/{y}.png"}
    return Dataset.objects.create(
        stac_id=stac_id,
        title=stac_id,
        imagery=imagery,
        primary_input=next(iter(imagery)),
        status=status,
        visibility=visibility,
        user=user,
    )


def _project(
    user: OsmUser, status: str = ValidationProject.Status.PUBLISHED, **fields
) -> ValidationProject:
    defaults = {
        "source_ids": ["freetown"],
        "type": "training",
        "title": "Freetown",
        "status": status,
        "build_status": ValidationProject.BuildStatus.BUILT,
        "build_requested_at": timezone.now(),
    }
    return ValidationProject.objects.create(user=user, **{**defaults, **fields})


def _create_body(**fields) -> dict:
    return {"source_ids": ["freetown"], "type": "training", "title": "Freetown buildings", **fields}


def _answers(project: ValidationProject, client: APIClient, answers: list[dict], **extra):
    return client.post(f"{URL}{project.id}/answers/", {"answers": answers, **extra}, format="json")


@patch("validation.views.build_project")
def test_create_makes_a_draft_and_queues_the_build(
    mock_build, client, user, django_capture_on_commit_callbacks
) -> None:
    _dataset(user)

    with django_capture_on_commit_callbacks(execute=True):
        response = client.post(URL, _create_body(), format="json")

    assert response.status_code == 202
    assert response.json()["respondent_count"] == 0
    project = ValidationProject.objects.get(id=response.json()["id"])
    assert project.status == ValidationProject.Status.DRAFT
    assert project.build_status == ValidationProject.BuildStatus.BUILDING
    mock_build.enqueue.assert_called_once()
    assert mock_build.enqueue.call_args.kwargs["project_id"] == project.id


@pytest.mark.parametrize(
    ("owner_is_caller", "status", "body"),
    [
        (False, Dataset.Status.BUILT, {}),
        (True, Dataset.Status.BUILDING, {}),
        (True, Dataset.Status.BUILT, {"status": "published"}),
    ],
)
@patch("validation.views.build_project")
def test_create_is_refused(
    mock_build, client, user, other_user, owner_is_caller, status, body
) -> None:
    _dataset(user if owner_is_caller else other_user, status=status)

    response = client.post(URL, _create_body(**body), format="json")

    assert response.status_code == 400
    mock_build.enqueue.assert_not_called()


@patch("validation.views.build_project")
def test_prediction_projects_need_a_finished_prediction(mock_build, client, user) -> None:
    prediction = Prediction.objects.create(
        local_model_stac_id="m",
        imagery={"image": "https://tiles.example/{z}/{x}/{y}.png"},
        primary_input="image",
        geometry={},
        zoom=19,
        results_ready=False,
        user=user,
    )
    body = {"source_ids": [str(prediction.id)], "type": "prediction", "title": "Check predictions"}

    assert client.post(URL, body, format="json").status_code == 400
    Prediction.objects.filter(id=prediction.id).update(results_ready=True, feature_count=5)
    assert client.post(URL, body, format="json").status_code == 202


def test_drafts_are_listed_only_for_their_owner(client, anon_client, user, other_user) -> None:
    _project(other_user, status=ValidationProject.Status.DRAFT, title="Someone's draft")
    _project(user, status=ValidationProject.Status.DRAFT, title="My draft")
    _project(other_user, title="Published")

    def titles(api: APIClient) -> set[str]:
        return {row["title"] for row in api.get(URL).json()["results"]}

    assert titles(anon_client) == {"Published"}
    assert titles(client) == {"Published", "My draft"}


def test_projects_count_each_respondent_once(anon_client, user, other_user) -> None:
    project = _project(user)
    _project(user, title="Unanswered")
    for tile_id, respondent in [(1, "g:a"), (2, "g:a"), (1, "u:1003")]:
        ValidationAnswer.objects.create(project=project, tile_id=tile_id, respondent=respondent, valid=True)

    counts = {row["title"]: row["respondent_count"] for row in anon_client.get(URL).json()["results"]}

    assert counts == {"Freetown": 2, "Unanswered": 0}
    assert [row["title"] for row in anon_client.get(URL).json()["results"]] == ["Unanswered", "Freetown"]
    assert anon_client.get(f"{URL}{project.id}/").json()["respondent_count"] == 2


@patch("validation.views.refresh_project")
def test_publish_waits_for_a_successful_build(
    mock_refresh, client, user, django_capture_on_commit_callbacks
) -> None:
    _dataset(user, visibility="public")
    project = _project(
        user,
        status=ValidationProject.Status.DRAFT,
        build_status=ValidationProject.BuildStatus.BUILDING,
    )
    url = f"{URL}{project.id}/"

    assert client.patch(url, {"status": "published"}, format="json").status_code == 400
    ValidationProject.objects.filter(id=project.id).update(
        build_status=ValidationProject.BuildStatus.FAILED, build_error="tippecanoe failed: bad"
    )
    failed = client.patch(url, {"status": "published"}, format="json")
    assert "tippecanoe failed: bad" in str(failed.json())
    ValidationProject.objects.filter(id=project.id).update(
        build_status=ValidationProject.BuildStatus.BUILT
    )
    with django_capture_on_commit_callbacks(execute=True):
        assert client.patch(url, {"status": "published"}, format="json").status_code == 200

    project.refresh_from_db()
    assert project.status == ValidationProject.Status.PUBLISHED
    mock_refresh.enqueue.assert_called_once_with(project_id=project.id)


@pytest.mark.parametrize(
    "body", [{"status": "draft"}, {"source_ids": ["elsewhere"]}, {"type": "prediction"}]
)
def test_published_project_rejects_invalid_changes(client, user, body) -> None:
    project = _project(user)

    assert client.patch(f"{URL}{project.id}/", body, format="json").status_code == 400


def test_only_the_owner_edits(client, other_user) -> None:
    project = _project(other_user)

    assert (
        client.patch(f"{URL}{project.id}/", {"title": "Mine now"}, format="json").status_code == 403
    )


def test_guest_answers_are_saved_once_and_replaced_on_change(anon_client, user) -> None:
    project = _project(user)
    guest = str(uuid.uuid4())

    for valid in (True, True, False):
        response = _answers(
            project, anon_client, [{"tile_id": TILE, "valid": valid}], guest_id=guest
        )
        assert response.status_code == 204

    answer = ValidationAnswer.objects.get(project=project)
    assert (answer.respondent, answer.valid) == (f"g:{guest}", False)


def test_signed_in_answers_use_the_account(client, user) -> None:
    project = _project(user)

    assert _answers(project, client, [{"tile_id": TILE, "valid": True}]).status_code == 204
    assert ValidationAnswer.objects.get(project=project).respondent == f"u:{user.osm_id}"


def test_answers_are_refused_without_a_respondent_or_on_drafts(anon_client, user) -> None:
    published = _project(user)
    draft = _project(user, status=ValidationProject.Status.DRAFT)
    guest = str(uuid.uuid4())
    one = [{"tile_id": TILE, "valid": True}]

    assert _answers(published, anon_client, one).status_code == 400
    assert _answers(draft, anon_client, one, guest_id=guest).status_code == 404
    too_many = [{"tile_id": TILE + i, "valid": True} for i in range(51)]
    assert _answers(published, anon_client, too_many, guest_id=guest).status_code == 400
    assert not ValidationAnswer.objects.exists()


@patch("validation.views.presigned_get_url", return_value="https://signed.example/imagery")
def test_files_redirect_for_visible_projects_only(mock_presign, anon_client, user) -> None:
    _dataset(user, visibility="public")
    published = _project(user)
    draft = _project(user, status=ValidationProject.Status.DRAFT)

    response = anon_client.get(f"{URL}{published.id}/files/imagery.pmtiles/")
    assert response.status_code == 302
    assert response["Location"] == "https://signed.example/imagery"
    assert anon_client.get(f"{URL}{published.id}/files/secrets.txt/").status_code == 404
    assert anon_client.get(f"{URL}{draft.id}/files/imagery.pmtiles/").status_code == 404


@patch("validation.views.presigned_get_url", return_value="https://signed.example/imagery")
def test_files_of_a_source_made_private_are_for_the_owner_only(
    mock_presign, anon_client, client, user
) -> None:
    _dataset(user, visibility="private")
    project = _project(user)
    url = f"{URL}{project.id}/files/imagery.pmtiles/"

    assert anon_client.get(url).status_code == 404
    assert client.get(url).status_code == 302


def test_verdict_needs_enough_answers_and_a_majority() -> None:
    assert tasks._verdict(1, 0, needed=1) is True
    assert tasks._verdict(0, 1, needed=1) is False
    assert tasks._verdict(1, 0, needed=3) is None
    assert tasks._verdict(2, 2, needed=3) is None
    assert tasks._verdict(1, 2, needed=3) is False


def test_done_bits_mark_decided_tiles_by_their_place_in_the_tile_list() -> None:
    tile_ids = np.array(sorted(zxy_to_tileid(19, x, 20) for x in range(10, 19)), dtype="<u8")
    tallies = [
        {"tile_id": int(tile_ids[1]), "yes": 1, "no": 0},
        {"tile_id": int(tile_ids[3]), "yes": 0, "no": 1},
        {"tile_id": int(tile_ids[8]), "yes": 1, "no": 0},
    ]

    bits = tasks._done_bits(tallies, tile_ids, needed=1)

    assert bits == bytes([0b00001010, 0b00000001])
    assert tasks._done_bits(tallies, tile_ids, needed=2) == bytes(2)


def test_results_hold_one_row_per_answered_tile() -> None:
    frame = tasks._results([{"tile_id": TILE, "yes": 2, "no": 1}], needed=3)
    buffer = io.BytesIO()
    frame.to_parquet(buffer)

    table = pd.read_parquet(io.BytesIO(buffer.getvalue()))
    assert table[["z", "x", "y", "yes", "no", "valid"]].to_dict("records") == [
        {"z": 19, "x": 233651, "y": 245320, "yes": 2, "no": 1, "valid": True}
    ]


def _write_chip(folder: Path, x: int, y: int, z: int) -> None:
    pixels = np.full((3, 256, 256), 120, dtype=np.uint8)
    with rasterio.open(
        folder / f"OAM-{x}-{y}-{z}.tif",
        "w",
        driver="GTiff",
        width=256,
        height=256,
        count=3,
        dtype="uint8",
        crs="EPSG:3857",
        transform=from_bounds(*mercantile.xy_bounds(x, y, z), 256, 256),
    ) as chip:
        chip.write(pixels)


def test_imagery_pmtiles_holds_every_chip_and_lists_their_tile_ids(tmp_path: Path) -> None:
    chips = tmp_path / "chips"
    chips.mkdir()
    for x, y in [(233651, 245320), (233652, 245320), (233651, 245321)]:
        _write_chip(chips, x, y, 19)
    (chips / "notes.txt").write_text("not a chip")
    target = tmp_path / "imagery.pmtiles"

    zoom, tile_ids = tasks._write_imagery([UPath(chips)], target)

    data = target.read_bytes()
    reader = Reader(lambda offset, length: data[offset : offset + length])
    expected = [(233651, 245320), (233652, 245320), (233651, 245321)]
    assert zoom == 19
    assert tile_ids == sorted(zxy_to_tileid(19, x, y) for x, y in expected)
    assert reader.metadata() == {"zoom": 19, "tiles": 3}
    assert reader.get(19, 233652, 245320)[:4] == b"RIFF"
    assert reader.get(19, 233652, 245321) is None


def test_imagery_rejects_chips_from_several_zooms(tmp_path: Path) -> None:
    _write_chip(tmp_path, 233651, 245320, 19)
    _write_chip(tmp_path, 116825, 122660, 18)

    with pytest.raises(ValueError, match="tiles at one zoom"):
        tasks._write_imagery([UPath(tmp_path)], tmp_path / "imagery.pmtiles")


@pytest.mark.skipif(
    shutil.which("tippecanoe") is None, reason="tippecanoe is only in the worker image"
)
def test_labels_pmtiles_is_built_at_the_chip_zoom(tmp_path: Path) -> None:
    labels = tmp_path / "source.geojson"
    labels.write_text(
        '{"type":"FeatureCollection","features":[{"type":"Feature","properties":{},'
        '"geometry":{"type":"Polygon","coordinates":[[[-13.2985,8.4940],[-13.2984,8.4940],'
        "[-13.2984,8.4941],[-13.2985,8.4941],[-13.2985,8.4940]]]}}]}"
    )

    target = tasks._write_labels([UPath(labels)], 19, tmp_path, {})

    data = target.read_bytes()
    header = Reader(lambda offset, length: data[offset : offset + length]).header()
    assert (header["min_zoom"], header["max_zoom"]) == (19, 19)


@pytest.mark.parametrize(("chips_exist", "fetched"), [(True, False), (False, True)])
def test_prediction_chips_are_fetched_again_only_when_deleted(user, chips_exist, fetched) -> None:
    prediction = Prediction.objects.create(
        local_model_stac_id="m",
        imagery={"image": "https://tiles.example/{z}/{x}/{y}.png"},
        primary_input="image",
        geometry={},
        zoom=19,
        results_ready=True,
        user=user,
    )
    project = _project(user, source_ids=[str(prediction.id)], type="prediction")

    with (
        patch.object(UPath, "exists", return_value=chips_exist),
        patch(
            "validation.tasks.materialize_prediction_input",
            return_value={"image": "s3://fair-data/dev/predict/refetched/image"},
        ) as materialize,
    ):
        chips, _, was_fetched = tasks._sources(project)

    assert was_fetched is fetched
    assert materialize.called is fetched
    assert str(chips[0]).endswith("refetched/image") is fetched


@patch("validation.views.build_project")
def test_create_refuses_multi_input_sources_and_empty_predictions(mock_build, client, user) -> None:
    _dataset(
        user,
        imagery={"post": "https://a.example/{z}/{x}/{y}", "pre": "https://b.example/{z}/{x}/{y}"},
    )
    empty = Prediction.objects.create(
        local_model_stac_id="m",
        imagery={"image": "https://tiles.example/{z}/{x}/{y}.png"},
        primary_input="image",
        geometry={},
        zoom=19,
        results_ready=True,
        feature_count=0,
        user=user,
    )

    assert client.post(URL, _create_body(), format="json").status_code == 400
    body = {"source_ids": [str(empty.id)], "type": "prediction", "title": "Nothing found"}
    assert client.post(URL, body, format="json").status_code == 400
    mock_build.enqueue.assert_not_called()


def test_publish_is_refused_for_a_private_source(client, user) -> None:
    _dataset(user, visibility="private")
    project = _project(user, status=ValidationProject.Status.DRAFT)

    response = client.patch(f"{URL}{project.id}/", {"status": "published"}, format="json")

    assert response.status_code == 400
    project.refresh_from_db()
    assert project.status == ValidationProject.Status.DRAFT


def test_answers_to_a_finished_project_are_gone(anon_client, user) -> None:
    project = _project(user, status=ValidationProject.Status.FINISHED)

    response = _answers(
        project, anon_client, [{"tile_id": TILE, "valid": True}], guest_id=str(uuid.uuid4())
    )

    assert response.status_code == 410
    assert not ValidationAnswer.objects.exists()


def test_malformed_answer_bodies_get_a_400(anon_client, user) -> None:
    project = _project(user)
    url = f"{URL}{project.id}/answers/"

    assert (
        anon_client.post(url, [{"tile_id": TILE, "valid": True}], format="json").status_code == 400
    )
    too_big = [{"tile_id": MAX_TILE_ID + 1, "valid": True}]
    assert _answers(project, anon_client, too_big, guest_id=str(uuid.uuid4())).status_code == 400


def test_refresh_ignores_tiles_outside_the_project_and_requeues_while_published(user) -> None:
    project = _project(user)
    tile_ids = np.array(
        sorted(zxy_to_tileid(19, x, y) for x in (10, 11, 12) for y in (20, 21)), dtype="<u8"
    )
    tiles = [(19, 11, 20), (19, 9, 21), (19, 13, 20), (18, 5, 10)]
    for z, x, y in tiles:
        ValidationAnswer.objects.create(
            project=project, tile_id=zxy_to_tileid(z, x, y), respondent="g:a", valid=True
        )
    written: dict[str, bytes] = {}

    def capture(self, data: bytes) -> None:
        written[self.name] = data

    with (
        patch("validation.tasks._tile_ids", return_value=tile_ids),
        patch.object(UPath, "write_bytes", capture),
    ):
        tasks.refresh_project.call(project_id=project.id)
        ValidationProject.objects.filter(id=project.id).update(status="finished")
        tasks.refresh_project.call(project_id=project.id)

    place = int(np.searchsorted(tile_ids, zxy_to_tileid(19, 11, 20)))
    assert written["done.bin"] == bytes([1 << place])
    assert len(pd.read_parquet(io.BytesIO(written["results.parquet"]))) == 1
    queued = DBTaskResult.objects.filter(
        task_path=tasks.refresh_project.module_path, status="READY"
    )
    assert queued.count() == 1


@pytest.mark.parametrize("fetched", [True, False])
def test_fetched_chips_are_queued_for_deletion_even_when_the_build_fails(user, fetched) -> None:
    project = _project(
        user, source_ids=["7"], type="prediction", status=ValidationProject.Status.DRAFT
    )
    chips = UPath("s3://fair-data/dev/predict/7/input/image")

    with (
        patch(
            "validation.tasks._sources",
            return_value=(chips, UPath("s3://x/labels.geojson"), fetched),
        ),
        patch("validation.tasks._write_imagery", side_effect=ValueError("no chips")),
        patch("validation.tasks.delete_prediction_input_tiles") as delete,
        pytest.raises(ValueError, match="no chips"),
    ):
        tasks.build_project.call(
            project_id=project.id, requested_at=project.build_requested_at.isoformat()
        )

    assert delete.enqueue.called is fetched
    if fetched:
        delete.enqueue.assert_called_once_with(prediction_id=7)


def test_training_chips_come_from_the_dataset_input(user) -> None:
    _dataset(user, imagery={"rgb": "https://tiles.example/{z}/{x}/{y}.png"})

    chips, labels, fetched = tasks._sources(_project(user))

    assert len(chips) == len(labels) == 1
    assert str(chips[0]).endswith(StoragePaths.dataset_chips_dir_key("freetown", "rgb"))
    assert str(labels[0]).endswith(StoragePaths.dataset_labels_geojson_key("freetown"))
    assert fetched is False


def test_build_uploads_the_tile_list_and_both_pmtiles(user, tmp_path) -> None:
    project = _project(
        user,
        status=ValidationProject.Status.DRAFT,
        build_status=ValidationProject.BuildStatus.BUILDING,
    )
    tile_ids = [TILE, TILE + 1]
    uploaded: list[str] = []
    labels = tmp_path / "labels.pmtiles"
    labels.write_bytes(b"labels")

    def write_imagery(_chips, target: Path) -> tuple[int, list[int]]:
        target.write_bytes(b"imagery")
        return 19, tile_ids

    def stored(_project_id: int, name: str) -> str:
        uploaded.append(name)
        return str(tmp_path / f"stored-{name}")

    with (
        patch("validation.tasks._sources", return_value=(UPath(tmp_path), UPath(labels), False)),
        patch("validation.tasks._dataset_bundle", return_value=None),
        patch("validation.tasks._write_imagery", side_effect=write_imagery),
        patch("validation.tasks._write_labels", return_value=labels),
        patch.object(StoragePaths, "validation_file_uri", side_effect=stored),
    ):
        tasks.build_project.call(
            project_id=project.id, requested_at=project.build_requested_at.isoformat()
        )

    assert sorted(uploaded) == ["imagery.pmtiles", "labels.pmtiles", "tiles.bin"]
    listed = np.frombuffer((tmp_path / "stored-tiles.bin").read_bytes(), dtype="<u8")
    assert listed.tolist() == tile_ids
    assert (tmp_path / "stored-labels.pmtiles").read_bytes() == b"labels"
    project.refresh_from_db()
    assert project.build_status == ValidationProject.BuildStatus.BUILT


def test_a_build_superseded_while_running_uploads_nothing(user, tmp_path) -> None:
    project = _project(
        user,
        status=ValidationProject.Status.DRAFT,
        build_status=ValidationProject.BuildStatus.BUILDING,
    )
    labels = tmp_path / "labels.pmtiles"
    labels.write_bytes(b"labels")
    newer = project.build_requested_at + timedelta(minutes=1)

    def write_imagery(_chips, target: Path) -> tuple[int, list[int]]:
        ValidationProject.objects.filter(id=project.id).update(build_requested_at=newer)
        target.write_bytes(b"imagery")
        return 19, [TILE]

    with (
        patch("validation.tasks._sources", return_value=(UPath(tmp_path), UPath(labels), False)),
        patch("validation.tasks._dataset_bundle", return_value=None),
        patch("validation.tasks._write_imagery", side_effect=write_imagery),
        patch("validation.tasks._write_labels", return_value=labels),
        patch.object(StoragePaths, "validation_file_uri") as stored,
    ):
        tasks.build_project.call(
            project_id=project.id, requested_at=project.build_requested_at.isoformat()
        )

    stored.assert_not_called()
    project.refresh_from_db()
    assert project.build_status == ValidationProject.BuildStatus.BUILDING


def test_guests_get_429_beyond_the_network_rate(anon_client, user) -> None:
    project = _project(user)
    body = [{"tile_id": TILE, "valid": True}]
    rates = {"validation_answers_network": "1/min"}

    cache.clear()
    with patch.dict(GuestAnswerRateThrottle.THROTTLE_RATES, rates):
        first = _answers(project, anon_client, body, guest_id=str(uuid.uuid4()))
        second = _answers(project, anon_client, body, guest_id=str(uuid.uuid4()))
    cache.clear()

    assert first.status_code == 204
    assert second.status_code == 429


def test_admin_delete_removes_the_projects_stored_files(user) -> None:
    project = _project(user)
    folder = StoragePaths.validation_dir_uri(project.id)

    with patch("validation.admin.remove_dir") as remove:
        ValidationProjectAdmin(ValidationProject, AdminSite()).delete_queryset(
            None, ValidationProject.objects.filter(id=project.id)
        )

    remove.assert_called_once_with(folder)
    assert not ValidationProject.objects.filter(id=project.id).exists()


@pytest.mark.skipif(
    shutil.which("tippecanoe") is None, reason="tippecanoe is only in the worker image"
)
def test_a_broken_labels_file_fails_the_labels_build_with_its_reason(tmp_path: Path) -> None:
    labels = tmp_path / "broken.geojson"
    labels.write_text('{"type": "FeatureCollection", "features": [')

    with pytest.raises(RuntimeError, match="Unterminated array"):
        tasks._write_labels([UPath(labels)], 19, tmp_path, {})


@pytest.mark.parametrize("name", ["done.bin", "results.parquet"])
def test_refreshed_files_answer_404_before_the_first_refresh(anon_client, user, name) -> None:
    _dataset(user, visibility="public")
    project = _project(user)

    with patch.object(UPath, "exists", return_value=False):
        response = anon_client.get(f"{URL}{project.id}/files/{name}/")

    assert response.status_code == 404


def test_a_tile_twice_in_one_batch_keeps_the_last_answer(anon_client, user) -> None:
    project = _project(user)
    body = [{"tile_id": TILE, "valid": True}, {"tile_id": TILE, "valid": False}]

    response = _answers(project, anon_client, body, guest_id=str(uuid.uuid4()))

    assert response.status_code == 204
    assert list(ValidationAnswer.objects.values_list("valid", flat=True)) == [False]


@patch("validation.views.build_project")
def test_a_prediction_id_with_non_ascii_digits_is_refused(mock_build, client, user) -> None:
    body = {"source_ids": ["²"], "type": "prediction", "title": "Odd digits"}

    assert client.post(URL, body, format="json").status_code == 400
    mock_build.enqueue.assert_not_called()


def test_a_finished_project_cannot_change(client, user) -> None:
    project = _project(user, status=ValidationProject.Status.FINISHED)

    response = client.patch(f"{URL}{project.id}/", {"answers_needed": 3}, format="json")

    assert response.status_code == 400
    project.refresh_from_db()
    assert project.answers_needed == 1


def test_refresh_of_a_deleted_project_stops_quietly(user) -> None:
    project = _project(user)
    project_id = project.id
    project.delete()

    tasks.refresh_project.call(project_id=project_id)

    queued = DBTaskResult.objects.filter(task_path=tasks.refresh_project.module_path)
    assert not queued.exists()


def test_a_failed_build_is_recorded_on_the_project(user) -> None:
    project = _project(
        user,
        status=ValidationProject.Status.DRAFT,
        build_status=ValidationProject.BuildStatus.BUILDING,
    )

    with (
        patch("validation.tasks._build_files", side_effect=ValueError("No OAM-x-y-z chips")),
        pytest.raises(ValueError),
    ):
        tasks.build_project.call(
            project_id=project.id, requested_at=project.build_requested_at.isoformat()
        )

    project.refresh_from_db()
    assert project.build_status == ValidationProject.BuildStatus.FAILED
    assert project.build_error == "No OAM-x-y-z chips"


def test_an_edit_keeps_a_build_status_set_during_the_request(user) -> None:
    project = _project(
        user,
        status=ValidationProject.Status.DRAFT,
        build_status=ValidationProject.BuildStatus.BUILDING,
    )
    loaded = ValidationProject.objects.get(id=project.id)
    ValidationProject.objects.filter(id=project.id).update(
        build_status=ValidationProject.BuildStatus.BUILT
    )
    serializer = ValidationProjectSerializer(loaded, data={"title": "Renamed"}, partial=True)

    assert serializer.is_valid(), serializer.errors
    serializer.save()

    project.refresh_from_db()
    assert project.title == "Renamed"
    assert project.build_status == ValidationProject.BuildStatus.BUILT


def test_a_build_for_a_deleted_project_does_nothing(user) -> None:
    project = _project(user, status=ValidationProject.Status.DRAFT)
    project_id = project.id
    project.delete()

    with patch("validation.tasks._build_files") as build:
        tasks.build_project.call(project_id=project_id, requested_at=timezone.now().isoformat())

    build.assert_not_called()


@patch("validation.views.build_project")
def test_opening_a_stale_build_queues_it_again(
    mock_build, client, user, django_capture_on_commit_callbacks, settings
) -> None:
    settings.VALIDATION_BUILD_TIMEOUT = 60
    project = _project(
        user,
        status=ValidationProject.Status.DRAFT,
        build_status=ValidationProject.BuildStatus.BUILDING,
        build_requested_at=timezone.now() - timedelta(seconds=120),
    )

    with django_capture_on_commit_callbacks(execute=True):
        client.get(f"{URL}{project.id}/")

    mock_build.enqueue.assert_called_once()
    assert mock_build.enqueue.call_args.kwargs["project_id"] == project.id
    project.refresh_from_db()
    assert timezone.now() - project.build_requested_at < timedelta(seconds=10)


@patch("validation.views.build_project")
def test_opening_a_build_in_progress_leaves_it_alone(
    mock_build, client, user, django_capture_on_commit_callbacks
) -> None:
    project = _project(
        user,
        status=ValidationProject.Status.DRAFT,
        build_status=ValidationProject.BuildStatus.BUILDING,
        build_requested_at=timezone.now(),
    )

    with django_capture_on_commit_callbacks(execute=True):
        client.get(f"{URL}{project.id}/")

    mock_build.enqueue.assert_not_called()


@patch("validation.views.build_project")
def test_the_owner_can_build_a_failed_draft_again(
    mock_build, client, user, django_capture_on_commit_callbacks
) -> None:
    project = _project(
        user,
        status=ValidationProject.Status.DRAFT,
        build_status=ValidationProject.BuildStatus.FAILED,
        build_error="tippecanoe failed",
    )

    with django_capture_on_commit_callbacks(execute=True):
        response = client.post(f"{URL}{project.id}/build/")

    assert response.status_code == 202
    assert response.json()["build_status"] == "building"
    assert response.json()["build_error"] == ""
    mock_build.enqueue.assert_called_once()
    assert mock_build.enqueue.call_args.kwargs["project_id"] == project.id


@patch("validation.views.build_project")
def test_only_the_owner_builds_and_only_drafts(mock_build, client, other_user, user) -> None:
    published = _project(user)
    draft = _project(user, status=ValidationProject.Status.DRAFT)

    assert client.post(f"{URL}{published.id}/build/").status_code == 400
    other = APIClient()
    other.force_authenticate(other_user)
    assert other.post(f"{URL}{published.id}/build/").status_code == 403
    assert other.post(f"{URL}{draft.id}/build/").status_code == 404
    mock_build.enqueue.assert_not_called()


@patch("validation.views.build_project")
def test_an_admin_can_build_any_draft_again(
    mock_build, admin_client, user, django_capture_on_commit_callbacks
) -> None:
    draft = _project(user, status=ValidationProject.Status.DRAFT)

    with django_capture_on_commit_callbacks(execute=True):
        assert admin_client.post(f"{URL}{draft.id}/build/").status_code == 202

    mock_build.enqueue.assert_called_once()


def test_a_superseded_build_leaves_the_newer_request_alone(user) -> None:
    project = _project(
        user,
        status=ValidationProject.Status.DRAFT,
        build_status=ValidationProject.BuildStatus.BUILDING,
        build_requested_at=timezone.now(),
    )
    older = (project.build_requested_at - timedelta(minutes=5)).isoformat()

    with patch("validation.tasks._build_files") as build:
        tasks.build_project.call(project_id=project.id, requested_at=older)

    build.assert_not_called()
    project.refresh_from_db()
    assert project.build_status == ValidationProject.BuildStatus.BUILDING


def test_a_build_keeps_a_title_edited_while_it_ran(user) -> None:
    project = _project(
        user,
        status=ValidationProject.Status.DRAFT,
        build_status=ValidationProject.BuildStatus.BUILDING,
    )

    def edit_during_build(_project):
        ValidationProject.objects.filter(id=project.id).update(title="Edited meanwhile")
        return 19, 1

    with patch("validation.tasks._build_files", side_effect=edit_during_build):
        tasks.build_project.call(
            project_id=project.id, requested_at=project.build_requested_at.isoformat()
        )

    project.refresh_from_db()
    assert project.title == "Edited meanwhile"
    assert project.build_status == ValidationProject.BuildStatus.BUILT


def test_guests_get_429_beyond_the_read_rate(anon_client, user) -> None:
    project = _project(user)
    rates = {"validation_read_network": "1/min"}

    cache.clear()
    with patch.dict(GuestReadRateThrottle.THROTTLE_RATES, rates):
        first = anon_client.get(f"{URL}{project.id}/")
        second = anon_client.get(f"{URL}{project.id}/")
    cache.clear()

    assert first.status_code == 200
    assert second.status_code == 429


def test_guests_are_not_held_to_the_signed_in_rate(anon_client, user) -> None:
    project = _project(user)
    rates = {"user": "1/min", "validation_read_network": "100/min"}

    cache.clear()
    with patch.dict(GuestReadRateThrottle.THROTTLE_RATES, rates):
        statuses = [anon_client.get(f"{URL}{project.id}/").status_code for _ in range(2)]
    cache.clear()

    assert statuses == [200, 200]


def test_signed_in_users_are_not_held_to_the_guest_rate(client, user) -> None:
    project = _project(user)
    rates = {"user": "100/min", "validation_read_network": "1/min"}

    cache.clear()
    with patch.dict(GuestReadRateThrottle.THROTTLE_RATES, rates):
        statuses = [client.get(f"{URL}{project.id}/").status_code for _ in range(2)]
    cache.clear()

    assert statuses == [200, 200]


@override_settings(
    CORS_ALLOWED_ORIGINS=["https://kshitijrajsharma.github.io"], CORS_ALLOW_ALL_ORIGINS=False
)
def test_a_cross_origin_app_may_send_a_range_header() -> None:
    response = APIClient().options(
        "/api/v1/validation/projects/1/files/tiles.bin/",
        HTTP_ORIGIN="https://kshitijrajsharma.github.io",
        HTTP_ACCESS_CONTROL_REQUEST_METHOD="GET",
        HTTP_ACCESS_CONTROL_REQUEST_HEADERS="range",
    )

    assert "range" in response["Access-Control-Allow-Headers"].split(", ")


@patch("validation.views.build_project")
def test_a_project_combines_datasets_over_the_same_imagery(mock_build, client, user) -> None:
    _dataset(user)
    _dataset(user, stac_id="freetown-groups")

    response = client.post(
        URL, _create_body(source_ids=["freetown", "freetown-groups"]), format="json"
    )

    assert response.status_code == 202
    assert response.data["source_ids"] == ["freetown", "freetown-groups"]


@pytest.mark.parametrize(
    "extras",
    [
        ["freetown"],
        ["freetown-groups", "freetown-groups"],
        ["missing"],
        ["elsewhere"],
        ["someone-elses"],
        ["a", "b", "c", "d", "e"],
    ],
)
@patch("validation.views.build_project")
def test_sources_must_be_distinct_built_owned_and_on_the_same_imagery(
    mock_build, client, user, other_user, extras
) -> None:
    _dataset(user)
    _dataset(user, stac_id="freetown-groups")
    _dataset(user, stac_id="elsewhere", imagery={"image": "https://other.example/{z}/{x}/{y}"})
    _dataset(other_user, stac_id="someone-elses")

    response = client.post(URL, _create_body(source_ids=["freetown", *extras]), format="json")

    assert response.status_code == 400
    assert "source_ids" in response.data["error"]["details"]


@patch("validation.views.build_project")
def test_a_prediction_project_has_exactly_one_source(mock_build, client, user) -> None:
    first, second = (
        Prediction.objects.create(
            local_model_stac_id="m",
            imagery={"image": "https://tiles.example/{z}/{x}/{y}.png"},
            primary_input="image",
            geometry={},
            zoom=19,
            results_ready=True,
            feature_count=3,
            user=user,
        )
        for _ in range(2)
    )

    response = client.post(
        URL,
        _create_body(source_ids=[str(first.id), str(second.id)], type="prediction"),
        format="json",
    )

    assert response.status_code == 400
    assert "one source" in str(response.data["error"]["details"]["source_ids"])


def test_publish_is_refused_while_any_dataset_is_private(client, user) -> None:
    _dataset(user, visibility="public")
    _dataset(user, stac_id="freetown-groups", visibility="private")
    project = _project(
        user, status=ValidationProject.Status.DRAFT, source_ids=["freetown", "freetown-groups"]
    )

    response = client.patch(f"{URL}{project.id}/", {"status": "published"}, format="json")

    assert response.status_code == 400
    assert "status" in response.data["error"]["details"]


def test_files_stay_hidden_while_any_dataset_is_private(anon_client, client, user) -> None:
    _dataset(user, visibility="public")
    _dataset(user, stac_id="freetown-groups", visibility="private")
    project = _project(user, source_ids=["freetown", "freetown-groups"])
    url = f"{URL}{project.id}/files/imagery.pmtiles/"

    with patch("validation.views.presigned_get_url", return_value="https://signed.example/f"):
        assert anon_client.get(url).status_code == 404
        assert client.get(url).status_code == 302


def test_sources_cannot_change_after_creation(client, user) -> None:
    project = _project(user, status=ValidationProject.Status.DRAFT)

    response = client.patch(
        f"{URL}{project.id}/", {"source_ids": ["freetown", "freetown-groups"]}, format="json"
    )

    assert response.status_code == 400
    assert "source_ids" in response.data["error"]["details"]


def test_the_build_reads_every_dataset_of_the_project(user) -> None:
    _dataset(user)
    _dataset(user, stac_id="freetown-groups")

    chips, labels, _ = tasks._sources(_project(user, source_ids=["freetown", "freetown-groups"]))

    assert len(chips) == len(labels) == 2
    assert str(chips[0]).endswith(StoragePaths.dataset_chips_dir_key("freetown", "image"))
    assert str(chips[1]).endswith(StoragePaths.dataset_chips_dir_key("freetown-groups", "image"))
    assert str(labels[1]).endswith(StoragePaths.dataset_labels_geojson_key("freetown-groups"))


def test_imagery_from_several_datasets_keeps_each_tile_once(tmp_path: Path) -> None:
    first, second = tmp_path / "first", tmp_path / "second"
    first.mkdir()
    second.mkdir()
    _write_chip(first, 233651, 245320, 19)
    _write_chip(second, 233651, 245320, 19)
    _write_chip(second, 233652, 245320, 19)

    _, tile_ids = tasks._write_imagery([UPath(first), UPath(second)], tmp_path / "i.pmtiles")

    assert tile_ids == sorted(zxy_to_tileid(19, x, 245320) for x in (233651, 233652))


@pytest.mark.skipif(
    shutil.which("tippecanoe") is None, reason="tippecanoe is only in the worker image"
)
def test_labels_from_several_datasets_share_one_layer(tmp_path: Path) -> None:
    points = tmp_path / "points.geojson"
    points.write_text(
        '{"type":"FeatureCollection","features":[{"type":"Feature","properties":{"class":"tree"},'
        '"geometry":{"type":"Point","coordinates":[-13.29845,8.49405]}}]}'
    )
    groups = tmp_path / "groups.geojson"
    groups.write_text(
        '{"type":"FeatureCollection","features":[{"type":"Feature",'
        '"properties":{"class":"tree_group"},"geometry":{"type":"Polygon","coordinates":'
        "[[[-13.2985,8.4940],[-13.2984,8.4940],[-13.2984,8.4941],[-13.2985,8.4941],"
        "[-13.2985,8.4940]]]}}]}"
    )

    target = tasks._write_labels([UPath(points), UPath(groups)], 19, tmp_path, {})

    data = target.read_bytes()
    stats = Reader(lambda offset, length: data[offset : offset + length]).metadata()["tilestats"]
    assert [layer["layer"] for layer in stats["layers"]] == ["labels"]
    assert sorted(stats["layers"][0]["attributes"][0]["values"]) == ["tree", "tree_group"]


def test_filtering_by_source_finds_projects_that_use_it_anywhere(client, user) -> None:
    combined = _project(user, source_ids=["freetown", "freetown-groups"])
    _project(user, source_ids=["elsewhere"])

    response = client.get(URL, {"source_id": "freetown-groups"})

    assert [project["id"] for project in response.data["results"]] == [combined.id]


def test_a_single_dataset_project_copies_the_dataset_pmtiles(user, tmp_path) -> None:
    project = _project(
        user,
        status=ValidationProject.Status.DRAFT,
        build_status=ValidationProject.BuildStatus.BUILDING,
    )
    bundle = tmp_path / "bundle"
    bundle.mkdir()
    (bundle / "imagery.pmtiles").write_bytes(b"imagery")
    (bundle / "labels.pmtiles").write_bytes(b"labels")
    gpd.GeoDataFrame(
        {"chip_id": ["OAM-233652-245320-19", "OAM-233651-245320-19"]},
        geometry=[box(*mercantile.bounds(x, 245320, 19)) for x in (233652, 233651)],
        crs="EPSG:4326",
    ).to_parquet(bundle / "tiles.parquet")
    item = MagicMock()
    item.assets = {
        key: MagicMock(href=str(bundle / name))
        for key, name in [
            ("imagery_pmtiles", "imagery.pmtiles"),
            ("labels_pmtiles", "labels.pmtiles"),
            ("tiles_parquet", "tiles.parquet"),
        ]
    }

    with (
        patch("validation.tasks.get_dataset", return_value=item),
        patch("validation.tasks._write_imagery") as convert,
        patch.object(
            StoragePaths, "validation_file_uri", side_effect=lambda _id, name: str(tmp_path / name)
        ),
    ):
        tasks.build_project.call(
            project_id=project.id, requested_at=project.build_requested_at.isoformat()
        )

    convert.assert_not_called()
    assert (tmp_path / "imagery.pmtiles").read_bytes() == b"imagery"
    assert (tmp_path / "labels.pmtiles").read_bytes() == b"labels"
    listed = np.frombuffer((tmp_path / "tiles.bin").read_bytes(), dtype="<u8").tolist()
    assert listed == sorted(zxy_to_tileid(19, x, 245320) for x in (233651, 233652))
    project.refresh_from_db()
    assert project.build_status == ValidationProject.BuildStatus.BUILT


@pytest.mark.parametrize(
    "fields", [{"source_ids": ["freetown", "bo"]}, {"type": "prediction"}]
)
def test_only_a_single_dataset_training_project_looks_up_a_bundle(user, fields) -> None:
    project = _project(user, status=ValidationProject.Status.DRAFT, **fields)

    with patch("validation.tasks.get_dataset", side_effect=AssertionError("looked up")):
        assert tasks._dataset_bundle(project) is None


def test_a_dataset_without_bundle_assets_has_no_bundle(user) -> None:
    project = _project(user, status=ValidationProject.Status.DRAFT)
    item = MagicMock()
    item.assets = {"labels": MagicMock(href="s3://b/labels")}

    with patch("validation.tasks.get_dataset", return_value=item):
        assert tasks._dataset_bundle(project) is None


def test_a_class_map_needs_the_bundle_labels_parquet(user) -> None:
    project = _project(
        user, status=ValidationProject.Status.DRAFT, class_map={"roof:material=tiles": "roof_tiles"}
    )
    item = MagicMock()
    item.assets = {
        key: MagicMock(href=f"s3://b/{key}")
        for key in ("imagery_pmtiles", "labels_pmtiles", "tiles_parquet")
    }

    with patch("validation.tasks.get_dataset", return_value=item):
        assert tasks._dataset_bundle(project) is None


def test_bundle_files_outside_the_bucket_fail_loudly(user) -> None:
    project = _project(user, status=ValidationProject.Status.DRAFT)
    item = MagicMock()
    item.assets = {
        key: MagicMock(href=f"https://elsewhere.example/{key}")
        for key in ("imagery_pmtiles", "labels_pmtiles", "tiles_parquet")
    }

    with (
        patch("validation.tasks.get_dataset", return_value=item),
        pytest.raises(ValueError, match="outside the bucket"),
    ):
        tasks._dataset_bundle(project)


_ROOFS = {
    "label:properties": ["roof:material"],
    "label:classes": [{"name": "roof:material", "classes": ["metal", "metal_sheet", "tiles"]}],
}


@patch("validation.views.build_project")
def test_create_keeps_a_class_map_of_declared_classes(mock_build, client, user) -> None:
    _dataset(user)
    class_map = {"roof:material=metal_sheet": "metal", "roof:material=tiles": "roof_tiles"}

    with patch("validation.serializers.get_dataset", return_value=MagicMock(properties=_ROOFS)):
        response = client.post(URL, _create_body(class_map=class_map), format="json")

    assert response.status_code == 202
    assert ValidationProject.objects.get(id=response.json()["id"]).class_map == class_map


@pytest.mark.parametrize(
    "class_map",
    [{"roof:material=slate": "metal"}, {"metal_sheet": "metal"}, {"roof:material=tiles": ""}],
    ids=["undeclared-class", "missing-property", "blank-target"],
)
@patch("validation.views.build_project")
def test_create_refuses_a_class_map_it_cannot_apply(
    mock_build, client, user, class_map, django_capture_on_commit_callbacks
) -> None:
    _dataset(user)

    with (
        patch("validation.serializers.get_dataset", return_value=MagicMock(properties=_ROOFS)),
        django_capture_on_commit_callbacks(execute=True),
    ):
        response = client.post(URL, _create_body(class_map=class_map), format="json")

    assert response.status_code == 400
    assert "class_map" in response.json()["error"]["details"]
    mock_build.enqueue.assert_not_called()


@patch("validation.views.build_project")
def test_create_refuses_a_class_map_on_a_source_without_classes(
    mock_build, client, user, django_capture_on_commit_callbacks
) -> None:
    _dataset(user)

    with (
        patch("validation.serializers.get_dataset", return_value=MagicMock(properties={})),
        django_capture_on_commit_callbacks(execute=True),
    ):
        response = client.post(
            URL, _create_body(class_map={"roof:material=tiles": "roof_tiles"}), format="json"
        )

    assert response.status_code == 400
    assert "freetown" in str(response.json()["error"]["details"]["class_map"])
    mock_build.enqueue.assert_not_called()


@patch("validation.views.build_project")
def test_a_prediction_project_cannot_merge_classes(
    mock_build, client, user, django_capture_on_commit_callbacks
) -> None:
    prediction = Prediction.objects.create(
        local_model_stac_id="m",
        imagery={"image": "https://tiles.example/{z}/{x}/{y}.png"},
        primary_input="image",
        geometry={},
        zoom=19,
        results_ready=True,
        feature_count=3,
        user=user,
    )
    body = {
        "source_ids": [str(prediction.id)],
        "type": "prediction",
        "title": "Roofs",
        "class_map": {"class=metal_sheet": "metal"},
    }

    with django_capture_on_commit_callbacks(execute=True):
        response = client.post(URL, body, format="json")

    assert response.status_code == 400
    assert "class_map" in response.json()["error"]["details"]
    mock_build.enqueue.assert_not_called()


def test_a_class_map_cannot_change_after_creation(client, user) -> None:
    project = _project(user, status=ValidationProject.Status.DRAFT)

    response = client.patch(
        f"{URL}{project.id}/", {"class_map": {"roof:material=tiles": "roof_tiles"}}, format="json"
    )

    assert response.status_code == 400
    project.refresh_from_db()
    assert project.class_map == {}


@pytest.mark.skipif(
    shutil.which("tippecanoe") is None, reason="tippecanoe is only in the worker image"
)
@pytest.mark.parametrize("suffix", [".geojson", ".parquet"])
@pytest.mark.parametrize(
    ("class_map", "expected"),
    [
        (
            {"roof:material=metal_sheet": "metal", "roof:material=tiles": "roof_tiles"},
            ["metal", "roof_tiles"],
        ),
        (
            {"roof:material=metal_sheet": "metal", "roof:material=metal": "iron"},
            ["iron", "metal", "tiles"],
        ),
    ],
    ids=["merge", "each-class-maps-once"],
)
def test_a_class_map_merges_classes_in_the_tile_labels(
    tmp_path: Path, suffix: str, class_map: dict[str, str], expected: list[str]
) -> None:
    labels = gpd.GeoDataFrame(
        {"roof:material": ["metal", "metal_sheet", "tiles", None]},
        geometry=[
            box(-13.2985 + i * 0.0001, 8.494, -13.29845 + i * 0.0001, 8.49405) for i in range(4)
        ],
        crs="EPSG:4326",
    )
    source = tmp_path / f"source{suffix}"
    if suffix == ".parquet":
        labels.to_parquet(source)
    else:
        labels.to_file(source, driver="GeoJSON")
    work = tmp_path / "work"
    work.mkdir()

    target = tasks._write_labels([UPath(source)], 19, work, class_map)

    data = target.read_bytes()
    stats = Reader(lambda offset, length: data[offset : offset + length]).metadata()["tilestats"]
    assert sorted(stats["layers"][0]["attributes"][0]["values"]) == expected


def _roofs_and_trees(tmp_path: Path) -> list[UPath]:
    roofs = gpd.GeoDataFrame(
        {"roof:material": ["metal_sheet"]},
        geometry=[box(-13.2985, 8.494, -13.29845, 8.49405)],
        crs="EPSG:4326",
    )
    trees = gpd.GeoDataFrame(
        {"natural": ["tree"]}, geometry=[box(-13.2984, 8.494, -13.29835, 8.49405)], crs="EPSG:4326"
    )
    roofs.to_parquet(tmp_path / "roofs.parquet")
    trees.to_parquet(tmp_path / "trees.parquet")
    return [UPath(tmp_path / "roofs.parquet"), UPath(tmp_path / "trees.parquet")]


@pytest.mark.skipif(
    shutil.which("tippecanoe") is None, reason="tippecanoe is only in the worker image"
)
def test_a_class_map_property_needs_one_labels_file_that_has_it(tmp_path: Path) -> None:
    work = tmp_path / "work"
    work.mkdir()

    target = tasks._write_labels(
        _roofs_and_trees(tmp_path), 19, work, {"roof:material=metal_sheet": "metal"}
    )

    assert target.exists()


def test_a_class_map_property_in_no_labels_file_fails_the_labels_build(tmp_path: Path) -> None:
    work = tmp_path / "work"
    work.mkdir()

    with pytest.raises(ValueError, match="building"):
        tasks._write_labels(_roofs_and_trees(tmp_path), 19, work, {"building=yes": "house"})


def test_a_class_map_on_numbers_fails_the_labels_build(tmp_path: Path) -> None:
    levels = tmp_path / "levels.parquet"
    gpd.GeoDataFrame(
        {"building:levels": [2, 3]},
        geometry=[box(-13.2985, 8.494, -13.29845, 8.49405)] * 2,
        crs="EPSG:4326",
    ).to_parquet(levels)
    work = tmp_path / "work"
    work.mkdir()

    with pytest.raises(ValueError, match="text classes only"):
        tasks._write_labels([UPath(levels)], 19, work, {"building:levels=2": "low"})


def test_a_bundle_project_with_a_class_map_writes_merged_labels(user, tmp_path) -> None:
    class_map = {"roof:material=metal_sheet": "metal"}
    project = _project(
        user,
        status=ValidationProject.Status.DRAFT,
        build_status=ValidationProject.BuildStatus.BUILDING,
        class_map=class_map,
    )
    bundle = tmp_path / "bundle"
    bundle.mkdir()
    for name in ("imagery.pmtiles", "labels.pmtiles", "labels.parquet"):
        (bundle / name).write_bytes(name.encode())
    gpd.GeoDataFrame(
        {"chip_id": ["OAM-233651-245320-19"]},
        geometry=[box(*mercantile.bounds(233651, 245320, 19))],
        crs="EPSG:4326",
    ).to_parquet(bundle / "tiles.parquet")
    item = MagicMock()
    item.assets = {
        key: MagicMock(href=str(bundle / name))
        for key, name in [
            ("imagery_pmtiles", "imagery.pmtiles"),
            ("labels_pmtiles", "labels.pmtiles"),
            ("labels_parquet", "labels.parquet"),
            ("tiles_parquet", "tiles.parquet"),
        ]
    }

    def merged(labels, zoom, workdir, mapping):
        target = workdir / "labels.pmtiles"
        target.write_bytes(b"merged")
        return target

    with (
        patch("validation.tasks.get_dataset", return_value=item),
        patch("validation.tasks._write_labels", side_effect=merged) as write_labels,
        patch.object(
            StoragePaths, "validation_file_uri", side_effect=lambda _id, name: str(tmp_path / name)
        ),
    ):
        tasks.build_project.call(
            project_id=project.id, requested_at=project.build_requested_at.isoformat()
        )

    sources, zoom, _, mapping = write_labels.call_args.args
    assert [str(source) for source in sources] == [str(bundle / "labels.parquet")]
    assert (zoom, mapping) == (19, class_map)
    assert (tmp_path / "labels.pmtiles").read_bytes() == b"merged"
    assert (tmp_path / "imagery.pmtiles").read_bytes() == b"imagery.pmtiles"
