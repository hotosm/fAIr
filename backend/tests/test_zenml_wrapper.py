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
