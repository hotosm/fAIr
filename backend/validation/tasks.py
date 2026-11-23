import io
import logging
import math
import re
import shutil
import subprocess
import tempfile
from datetime import timedelta
from pathlib import Path

import geopandas as gpd
import numpy as np
import rasterio
from django.conf import settings
from django.db.models import Count, Q
from django.utils import timezone
from django_tasks import task
from PIL import Image
from pmtiles.tile import Compression, TileType, tileid_to_zxy, zxy_to_tileid
from pmtiles.writer import Writer
from shapely.geometry import box
from upath import UPath

from datasets.models import Dataset
from predictions.models import Prediction
from predictions.tasks import delete_prediction_input_tiles, materialize_prediction_input
from shared.enums import ValidationBuildStatus, ValidationStatus, ValidationType
from shared.storage import StoragePaths

from .models import ValidationProject

logger = logging.getLogger(__name__)

_CHIP_NAME = re.compile(r"OAM-(\d+)-(\d+)-(\d+)\.tiff?")
_WEBP_QUALITY = 80
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


def _tile_lonlat(x: int, y: int, z: int) -> tuple[float, float]:
    n = 2**z
    return x / n * 360 - 180, math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * y / n))))


def _chip_tile(name: str) -> tuple[int, int, int] | None:
    match = _CHIP_NAME.fullmatch(name)
    return (int(match[1]), int(match[2]), int(match[3])) if match else None


def _webp(chip: UPath) -> bytes:
    with rasterio.MemoryFile(chip.read_bytes()) as memfile, memfile.open() as src:
        rgb = np.moveaxis(src.read([1, 2, 3]), 0, -1)
    out = io.BytesIO()
    Image.fromarray(rgb).save(out, format="WEBP", quality=_WEBP_QUALITY)
    return out.getvalue()


def _write_imagery(chips_dirs: list[UPath], target: Path) -> tuple[int, list[int]]:
    chips = {}
    for chips_dir in chips_dirs:
        for chip in chips_dir.iterdir():
            if tile := _chip_tile(chip.name):
                x, y, z = tile
                chips.setdefault(zxy_to_tileid(z, x, y), (chip, x, y, z))
    if not chips:
        raise ValueError(f"No OAM-x-y-z chips in {', '.join(map(str, chips_dirs))}")
    zooms = {z for _, _, _, z in chips.values()}
    if len(zooms) != 1:
        raise ValueError(f"Chips span several zooms {sorted(zooms)}; expected one")
    zoom = zooms.pop()
    xs = [x for _, x, _, _ in chips.values()]
    ys = [y for _, _, y, _ in chips.values()]
    west, north = _tile_lonlat(min(xs), min(ys), zoom)
    east, south = _tile_lonlat(max(xs) + 1, max(ys) + 1, zoom)
    tile_ids = sorted(chips)
    with target.open("wb") as handle:
        writer = Writer(handle)
        for tile_id in tile_ids:
            writer.write_tile(tile_id, _webp(chips[tile_id][0]))
        writer.finalize(
            {
                "tile_type": TileType.WEBP,
                "tile_compression": Compression.NONE,
                "min_lon_e7": int(west * 1e7),
                "min_lat_e7": int(south * 1e7),
                "max_lon_e7": int(east * 1e7),
                "max_lat_e7": int(north * 1e7),
                "center_zoom": zoom,
            },
            {"zoom": zoom, "tiles": len(tile_ids)},
        )
    return zoom, tile_ids


def _write_labels(labels: list[UPath], zoom: int, workdir: Path) -> Path:
    if shutil.which("tippecanoe") is None:
        raise RuntimeError("tippecanoe not found in PATH; the worker image installs it.")
    inputs = []
    for index, source in enumerate(labels):
        geojson = workdir / f"labels-{index}.geojson"
        geojson.write_bytes(source.read_bytes())
        inputs.append(str(geojson))
    target = workdir / "labels.pmtiles"
    try:
        subprocess.run(
            [
                "tippecanoe",
                "-o",
                str(target),
                "-z",
                str(zoom),
                "-Z",
                str(zoom),
                "-l",
                "labels",
                "--force",
                "--no-tile-size-limit",
                "--no-feature-limit",
                *inputs,
            ],
            check=True,
            capture_output=True,
        )
    except subprocess.CalledProcessError as error:
        raise RuntimeError(f"tippecanoe failed: {error.stderr.decode()[-2000:]}") from error
    return target


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
    chips_dirs, labels, fetched = _sources(project)
    try:
        with tempfile.TemporaryDirectory(prefix=f"fair-validation-{project_id}-") as tmp:
            workdir = Path(tmp)
            imagery = workdir / "imagery.pmtiles"
            zoom, tile_ids = _write_imagery(chips_dirs, imagery)
            tile_list = workdir / "tiles.bin"
            tile_list.write_bytes(np.array(tile_ids, dtype=_TILE_ID).tobytes())
            labels_pmtiles = _write_labels(labels, zoom, workdir)
            superseded = not ValidationProject.objects.filter(
                id=project_id, build_requested_at=project.build_requested_at
            ).exists()
            if superseded:
                return None
            for local in (tile_list, imagery, labels_pmtiles):
                target = UPath(StoragePaths.validation_file_uri(project_id, local.name))
                target.fs.put_file(str(local), target.path)
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
        west, north = _tile_lonlat(x, y, z)
        east, south = _tile_lonlat(x + 1, y + 1, z)
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
