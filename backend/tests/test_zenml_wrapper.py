from unittest.mock import MagicMock, patch

import pytest

from shared.integrations import zenml as wrapper


@pytest.fixture(autouse=True)
def _reset_master_client():
    wrapper.reset_master_client()
    yield
    wrapper.reset_master_client()


@patch("shared.integrations.zenml.FairClient")
def test_get_master_client_constructs_once_with_required_settings(mock_fair_client_cls, settings):
    settings.FAIR_ZENML_STORE_URL = "http://zenml.test"
    settings.FAIR_STAC_API_URL = "http://stac.test"
    settings.FAIR_STAC_API_KEY = "secret-key"
    instance = MagicMock()
    mock_fair_client_cls.return_value = instance

    first = wrapper.get_master_client()
    second = wrapper.get_master_client()

    assert first is second is instance
    assert mock_fair_client_cls.call_count == 1
    instance.setup.assert_called_once()
    kwargs = mock_fair_client_cls.call_args.kwargs
    assert kwargs["zenml_store_url"] == "http://zenml.test"
    assert kwargs["stac_api_url"] == "http://stac.test"
    assert kwargs["stac_api_key"] == "secret-key"
    assert kwargs["upload_artifacts"] is True


@patch("shared.integrations.zenml.FairClient")
def test_get_master_client_raises_when_required_setting_missing(mock_fair_client_cls, settings):
    settings.FAIR_ZENML_STORE_URL = ""
    with pytest.raises(RuntimeError, match="FAIR_ZENML_STORE_URL"):
        wrapper.get_master_client()
    mock_fair_client_cls.assert_not_called()


@patch("shared.integrations.zenml.FairClient")
def test_for_user_returns_proxy_via_with_user(mock_fair_client_cls, settings):
    settings.FAIR_ZENML_STORE_URL = "http://zenml.test"
    settings.FAIR_STAC_API_URL = "http://stac.test"
    instance = MagicMock()
    proxy = MagicMock()
    instance.with_user.return_value = proxy
    mock_fair_client_cls.return_value = instance

    result = wrapper.for_user("alice")

    assert result is proxy
    instance.with_user.assert_called_once_with("alice")


@patch("shared.integrations.zenml.FairClient")
def test_for_user_reuses_master_client_across_calls(mock_fair_client_cls, settings):
    settings.FAIR_ZENML_STORE_URL = "http://zenml.test"
    settings.FAIR_STAC_API_URL = "http://stac.test"
    instance = MagicMock()
    mock_fair_client_cls.return_value = instance

    wrapper.for_user("alice")
    wrapper.for_user("bob")
    wrapper.for_user("carol")

    assert mock_fair_client_cls.call_count == 1
    assert instance.with_user.call_count == 3


@patch("shared.integrations.zenml._get_run_status")
def test_get_run_status_passes_through(mock_status):
    mock_status.return_value = "running"
    assert wrapper.get_run_status("run-1") == "running"
    mock_status.assert_called_once_with("run-1")


@patch("shared.integrations.zenml._fetch_run_logs")
def test_fetch_run_logs_passes_tail(mock_fetch):
    mock_fetch.return_value = []
    wrapper.fetch_run_logs("run-1", tail=200)
    mock_fetch.assert_called_once_with("run-1", tail=200)


@patch("shared.integrations.zenml._fetch_step_logs")
def test_fetch_step_logs_passes_step(mock_fetch):
    mock_fetch.return_value = []
    wrapper.fetch_step_logs("run-1", "train_model", tail=50)
    mock_fetch.assert_called_once_with("run-1", "train_model", tail=50)


@patch("shared.integrations.zenml._list_runs_for_model")
def test_list_runs_for_model_passes_limit(mock_list):
    mock_list.return_value = []
    wrapper.list_runs_for_model("my-model", limit=10)
    mock_list.assert_called_once_with("my-model", limit=10)


@patch("shared.integrations.zenml._is_terminal")
def test_is_terminal_passes_through(mock_is_terminal):
    mock_is_terminal.return_value = True
    assert wrapper.is_terminal("completed") is True
    mock_is_terminal.assert_called_once_with("completed")


@patch("shared.integrations.zenml.FairClient")
def test_reset_master_client_forces_reconstruction(mock_fair_client_cls, settings):
    settings.FAIR_ZENML_STORE_URL = "http://zenml.test"
    settings.FAIR_STAC_API_URL = "http://stac.test"
    instance_a = MagicMock()
    instance_b = MagicMock()
    mock_fair_client_cls.side_effect = [instance_a, instance_b]

    first = wrapper.get_master_client()
    wrapper.reset_master_client()
    second = wrapper.get_master_client()

    assert first is instance_a
    assert second is instance_b
    assert mock_fair_client_cls.call_count == 2
