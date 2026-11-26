import io
import logging
import math
import tempfile
from datetime import timedelta
from pathlib import Path

import geopandas as gpd
import mercantile
import numpy as np
from django.conf import settings
from django.db.models import Count, Q
from django.utils import timezone
from django_tasks import task
from fair.bundle import (
    chip_bounds,
    collect_chips,
    grid_tiles,
    pmtiles_tile_id,
    read_tile_ids,
    write_imagery_pmtiles,
    write_labels_pmtiles,
)
from fair.utils.data import http_url_to_s3_uri
from pmtiles.tile import tileid_to_zxy
from shapely.geometry import box
from upath import UPath

from datasets.models import Dataset
from predictions.models import Prediction
from predictions.tasks import delete_prediction_input_tiles, materialize_prediction_input
from shared.enums import ValidationBuildStatus, ValidationStatus, ValidationType
from shared.integrations.stac import get_dataset
from shared.storage import StoragePaths

from .models import ValidationProject

logger = logging.getLogger(__name__)

_TILE_ID = np.dtype("<u8")


def _sources(project: ValidationProject) -> tuple[list[UPath], list[UPath], bool]:
    source_ids: list[str] = project.source_ids  # type: ignore[assignment]
    if project.type == ValidationType.TRAINING:
        chips, labels = [], []
        for stac_id in source_ids:
            dataset = Dataset.objects.get(stac_id=stac_id)
            chips.append(UPath(StoragePaths.dataset_chips_dir_uri(stac_id, dataset.primary_input)))
            labels.append(
                UPath(StoragePaths.dataset_labels_dir_uri(stac_id))
                / StoragePaths.LABELS_GEOJSON_FILENAME
            )
        return chips, labels, False
    prediction = Prediction.objects.get(id=int(source_ids[0]))
    labels = [UPath(StoragePaths.prediction_geojson_uri(prediction.id))]
    image = prediction.primary_input
    chips = UPath(StoragePaths.prediction_input_dir_uri(prediction.id, image))
    if chips.exists():
        return [chips], labels, False
    # Prediction input tiles may be deleted after the run (DELETE_PREDICTION_INPUT_TILES).
    return [UPath(materialize_prediction_input(prediction)[image])], labels, True


def _write_imagery(chips_dirs: list[UPath], target: Path) -> tuple[int, list[int]]:
    chips = collect_chips(chips_dirs)
    tiles = grid_tiles(chip_bounds(chips))
    if tiles is None:
        raise ValueError("Validation needs chips that are distinct web-mercator tiles at one zoom")
    write_imagery_pmtiles(
        {tile: chips[chip_id] for tile, chip_id in tiles.items()}, target, "medium"
    )
    return next(iter(tiles)).z, sorted(pmtiles_tile_id(tile) for tile in tiles)


def _write_labels(labels: list[UPath], zoom: int, workdir: Path) -> Path:
    local = []
    for index, source in enumerate(labels):
        geojson = workdir / f"labels-{index}.geojson"
        geojson.write_bytes(source.read_bytes())
        local.append(geojson)
    target = workdir / "labels.pmtiles"
    write_labels_pmtiles(local, zoom, target)
    return target


def _dataset_bundle(project: ValidationProject) -> dict[str, UPath] | None:
    source_ids: list[str] = project.source_ids  # type: ignore[assignment]
    if project.type != ValidationType.TRAINING or len(source_ids) != 1:
        return None
    assets = get_dataset(source_ids[0]).assets
    keys = ("imagery_pmtiles", "labels_pmtiles", "tiles_parquet")
    if not all(key in assets for key in keys):
        return None
    uris = {key: http_url_to_s3_uri(assets[key].href) for key in keys}
    if unmapped := [uri for uri in uris.values() if uri.startswith(("http://", "https://"))]:
        raise ValueError(f"Dataset bundle files are outside the bucket: {unmapped}")
    return {key: UPath(uri) for key, uri in uris.items()}


@task()
def build_project(*, project_id: int, requested_at: str) -> None:
    project = ValidationProject.objects.filter(id=project_id).first()
    if project is None:
        return
    # A newer request supersedes this build; only its own result may be written.
    if project.build_requested_at is None or project.build_requested_at.isoformat() != requested_at:
        return
    rows = ValidationProject.objects.filter(
        id=project_id, build_requested_at=project.build_requested_at
    )
    try:
        built = _build_files(project)
    except Exception as error:
        # Any build failure is recorded for the owner, then re-raised for the worker log.
        rows.update(build_status=ValidationBuildStatus.FAILED, build_error=str(error)[:2000])
        raise
    if built is None:
        return
    zoom, tile_count = built
    rows.update(build_status=ValidationBuildStatus.BUILT, build_error="")
    logger.info("Validation project %s: %s tiles at zoom %s", project_id, tile_count, zoom)


def _build_files(project: ValidationProject) -> tuple[int, int] | None:
    project_id = project.id
    bundle = _dataset_bundle(project)
    fetched = False
    try:
        with tempfile.TemporaryDirectory(prefix=f"fair-validation-{project_id}-") as tmp:
            workdir = Path(tmp)
            tile_list = workdir / "tiles.bin"
            copies: dict[str, UPath] = {}
            if bundle is not None:
                tile_ids = read_tile_ids(bundle["tiles_parquet"])
                zoom = tileid_to_zxy(tile_ids[0])[0]
                copies = {
                    "imagery.pmtiles": bundle["imagery_pmtiles"],
                    "labels.pmtiles": bundle["labels_pmtiles"],
                }
                written = [tile_list]
            else:
                chips_dirs, labels, fetched = _sources(project)
                imagery = workdir / "imagery.pmtiles"
                zoom, tile_ids = _write_imagery(chips_dirs, imagery)
                written = [tile_list, imagery, _write_labels(labels, zoom, workdir)]
            tile_list.write_bytes(np.array(tile_ids, dtype=_TILE_ID).tobytes())
            superseded = not ValidationProject.objects.filter(
                id=project_id, build_requested_at=project.build_requested_at
            ).exists()
            if superseded:
                return None
            for local in written:
                target = UPath(StoragePaths.validation_file_uri(project_id, local.name))
                target.fs.put_file(str(local), target.path)
            for name, source in copies.items():
                target = UPath(StoragePaths.validation_file_uri(project_id, name))
                source.fs.copy(source.path, target.path)
    finally:
        if fetched:
            source_ids: list[str] = project.source_ids  # type: ignore[assignment]
            delete_prediction_input_tiles.enqueue(prediction_id=int(source_ids[0]))
    return zoom, len(tile_ids)


def _tile_ids(project_id: int) -> np.ndarray:
    data = UPath(StoragePaths.validation_file_uri(project_id, "tiles.bin")).read_bytes()
    return np.frombuffer(data, dtype=_TILE_ID)


def _tallies(project: ValidationProject) -> list[dict]:
    return list(
        project.answers.values("tile_id").annotate(
            yes=Count("id", filter=Q(valid=True)), no=Count("id", filter=Q(valid=False))
        )
    )


def _verdict(yes: int, no: int, needed: int) -> bool | None:
    if yes + no < needed or yes == no:
        return None
    return yes > no


def _done_bits(tallies: list[dict], tile_ids: np.ndarray, needed: int) -> bytes:
    bits = bytearray(math.ceil(len(tile_ids) / 8))
    for row in tallies:
        if row["yes"] + row["no"] < needed:
            continue
        index = int(np.searchsorted(tile_ids, row["tile_id"]))
        bits[index // 8] |= 1 << (index % 8)
    return bytes(bits)


def _results(tallies: list[dict], needed: int) -> gpd.GeoDataFrame:
    rows = []
    for row in tallies:
        z, x, y = tileid_to_zxy(row["tile_id"])
        west, south, east, north = mercantile.bounds(x, y, z)
        rows.append(
            {
                "tile_id": row["tile_id"],
                "z": z,
                "x": x,
                "y": y,
                "yes": row["yes"],
                "no": row["no"],
                "valid": _verdict(row["yes"], row["no"], needed),
                "geometry": box(west, south, east, north),
            }
        )
    columns = ["tile_id", "z", "x", "y", "yes", "no", "valid", "geometry"]
    return gpd.GeoDataFrame(rows, columns=columns, geometry="geometry", crs="EPSG:4326")


@task()
def refresh_project(*, project_id: int) -> None:
    project = ValidationProject.objects.filter(id=project_id).first()
    if project is None or project.status == ValidationStatus.DRAFT:
        return
    if project.status == ValidationStatus.PUBLISHED:
        refresh_project.using(
            run_after=timezone.now() + timedelta(seconds=settings.VALIDATION_REFRESH_INTERVAL)
        ).enqueue(project_id=project_id)
    tile_ids = _tile_ids(project_id)
    known = set(tile_ids.tolist())
    tallies = [row for row in _tallies(project) if row["tile_id"] in known]
    UPath(StoragePaths.validation_file_uri(project_id, "done.bin")).write_bytes(
        _done_bits(tallies, tile_ids, project.answers_needed)
    )
    buffer = io.BytesIO()
    _results(tallies, project.answers_needed).to_parquet(buffer)
    UPath(StoragePaths.validation_file_uri(project_id, "results.parquet")).write_bytes(
        buffer.getvalue()
    )
