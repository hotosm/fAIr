from unittest.mock import patch

from django.conf import settings

from shared.integrations.stac import _public_links

_LINKS = [
    {"rel": "collection", "href": "http://stac:8080/collections/base-models"},
    {"rel": "root", "href": "http://stac:8080/"},
    {"rel": "license", "href": "https://spdx.org/licenses/MIT.html"},
    {"rel": "cite-as", "href": "https://doi.org/10.0/x"},
]


def test_drops_internal_host_links_keeps_public() -> None:
    with patch.object(settings, "FAIR_STAC_API_URL", "http://stac:8080"):
        out = _public_links(_LINKS)
    assert {link["rel"] for link in out} == {"license", "cite-as"}


def test_noop_when_stac_url_unset() -> None:
    with patch.object(settings, "FAIR_STAC_API_URL", None):
        assert _public_links(_LINKS) == _LINKS
