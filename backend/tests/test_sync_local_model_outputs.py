from datetime import UTC, datetime
from io import StringIO
from unittest.mock import patch

import pystac
import pytest
from django.core.management import call_command
from django.core.management.base import CommandError
from fair.stac.constants import DATACUBE_SCHEMA

from shared.integrations.stac import LOCAL_MODELS_COLLECTION

COMMAND = "modelregistry.management.commands.sync_local_model_outputs"
CONTRACT = {"mlm:architecture": "YOLO", "mlm:input": [{"name": "image"}]}
NEW_OUTPUTS = {
    "mlm:output": [{"name": "waste", "variables": ["class", "confidence"]}],
    "cube:variables": {"class": {"values": [1]}, "confidence": {"extent": [0, 1]}},
}
OLD_OUTPUTS = {
    "mlm:output": [{"name": "waste", "variables": ["class", "label"]}],
    "cube:variables": {"class": {"values": [1]}, "label": {"values": ["waste"]}},
}
NEW_IMAGE = "ghcr.io/hotosm/fair-models/waste@sha256:new"
OLD_IMAGE = "ghcr.io/hotosm/fair-models/waste@sha256:old"


def _item(item_id: str, image: str, **properties: object) -> pystac.Item:
    item = pystac.Item(item_id, None, None, datetime.now(UTC), {**CONTRACT, **properties})
    item.add_asset("mlm:training", pystac.Asset(href=image))
    return item


def _run(local_models: list[pystac.Item], *args: str) -> tuple[str, list]:
    name = {"mlm:name": "waste-grid"}
    base = _item("yolo_swag_waste_grid_segmentation", NEW_IMAGE, **name, **NEW_OUTPUTS)
    retired = _item("waste-grid-v1", OLD_IMAGE, **name, deprecated=True, **OLD_OUTPUTS)
    out = StringIO()
    with (
        patch(f"{COMMAND}.list_base_models", return_value=[retired, base]),
        patch(f"{COMMAND}.list_local_models", return_value=local_models),
        patch(f"{COMMAND}._merge_validate_write") as mock_write,
    ):
        call_command("sync_local_model_outputs", "--base-model", "waste-grid", *args, stdout=out)
    return out.getvalue(), mock_write.call_args_list


def test_stale_local_model_gets_the_base_model_outputs_and_images_matched_by_name() -> None:
    stale = _item("lm-1", OLD_IMAGE, **{"fair:base_model_name": "waste-grid"}, **OLD_OUTPUTS)

    output, calls = _run([stale])

    assert [call.args for call in calls] == [
        (
            LOCAL_MODELS_COLLECTION,
            "lm-1",
            NEW_OUTPUTS,
            [DATACUBE_SCHEMA],
            {"mlm:training": {"href": NEW_IMAGE}},
        )
    ]
    assert "1 local model item(s) updated" in output


def test_current_local_models_and_other_base_models_are_left_alone() -> None:
    current = _item("lm-1", NEW_IMAGE, **{"fair:base_model_name": "waste-grid"}, **NEW_OUTPUTS)
    other = _item("lm-2", OLD_IMAGE, **{"fair:base_model_name": "deepforest-tree"}, **OLD_OUTPUTS)

    output, calls = _run([current, other])

    assert calls == []
    assert "lm-1: already current" in output
    assert "0 local model item(s) updated" in output


def test_dry_run_lists_stale_items_and_changes_nothing() -> None:
    stale = _item("lm-1", OLD_IMAGE, **{"fair:base_model_name": "waste-grid"}, **OLD_OUTPUTS)

    output, calls = _run([stale], "--dry-run")

    assert calls == []
    assert "lm-1: outputs and images from yolo_swag_waste_grid_segmentation" in output
    assert "1 local model item(s) to update" in output


def test_local_model_built_on_another_architecture_is_skipped() -> None:
    older = _item(
        "lm-1",
        OLD_IMAGE,
        **{"fair:base_model_name": "waste-grid", "mlm:architecture": "ResNet"},
        **OLD_OUTPUTS,
    )

    output, calls = _run([older])

    assert calls == []
    assert "lm-1: skipped, mlm:architecture differ" in output


def test_two_active_base_models_with_one_name_are_refused() -> None:
    twins = [_item(name, NEW_IMAGE, **{"mlm:name": "waste-grid"}) for name in ("a", "b")]
    with (
        patch(f"{COMMAND}.list_base_models", return_value=twins),
        pytest.raises(
            CommandError, match="expected one active base model named waste-grid, found 2"
        ),
    ):
        call_command("sync_local_model_outputs", "--base-model", "waste-grid", stdout=StringIO())


def test_unknown_base_model_is_refused() -> None:
    with (
        patch(f"{COMMAND}.list_base_models", return_value=[]),
        pytest.raises(CommandError, match="expected one active base model named missing, found 0"),
    ):
        call_command("sync_local_model_outputs", "--base-model", "missing", stdout=StringIO())
