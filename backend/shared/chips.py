import logging
from pathlib import Path

from upath import UPath

logger = logging.getLogger(__name__)


def chip_files(directory: Path) -> dict[str, Path]:
    """Each file under `directory` by its path within it."""
    return {
        str(path.relative_to(directory)): path for path in directory.rglob("*") if path.is_file()
    }


def chips_every_input_has(downloads: dict[str, dict[str, Path]], context: str) -> set[str]:
    """Chip files present in the download of every input; the files an input drops are logged."""
    shared = set.intersection(*(set(files) for files in downloads.values()))
    for name, files in downloads.items():
        if dropped := len(files) - len(shared):
            logger.warning(
                "%s: %d %s files dropped, missing in another input", context, dropped, name
            )
    return shared


def upload_chips(files: dict[str, Path], names: set[str], prefix: UPath) -> None:
    for name in names:
        (prefix / name).write_bytes(files[name].read_bytes())
