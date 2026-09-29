from unittest.mock import MagicMock, patch

import pytest
from django.core.management import CommandError, call_command


@patch("modelregistry.management.commands.reconcile_knative.get_master_client")
def test_reconcile_knative_passes_template_and_prune(mock_client, settings, capsys):
    client = MagicMock()
    client.reconcile_knative.return_value = {"applied": ["m"], "removed": [], "failed": []}
    mock_client.return_value = client

    call_command("reconcile_knative", "--prune")

    client.reconcile_knative.assert_called_once_with(
        knative_template=settings.KNATIVE_SERVICE_TEMPLATE, prune=True
    )
    assert '"applied": ["m"]' in capsys.readouterr().out


@patch("modelregistry.management.commands.reconcile_knative.get_master_client")
def test_reconcile_knative_fails_on_failed_items(mock_client):
    mock_client.return_value.reconcile_knative.return_value = {
        "applied": [],
        "removed": [],
        "failed": ["m: boom"],
    }
    with pytest.raises(CommandError, match="1 base model"):
        call_command("reconcile_knative")
