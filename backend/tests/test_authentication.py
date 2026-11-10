from types import SimpleNamespace

import pytest
from rest_framework.test import APIClient

from accounts.authentication import HankoAuthentication


def test_hanko_returns_none_for_anonymous() -> None:
    """No Hanko user must yield a bare None so DRF falls back to AnonymousUser.

    Returning a ``(None, None)`` tuple sets ``request.user = None`` and crashes
    any downstream ``request.user.is_authenticated`` check.
    """
    request = SimpleNamespace(hotosm=SimpleNamespace(user=None))
    assert HankoAuthentication().authenticate(request) is None


@pytest.mark.parametrize(("suffix", "expected"), [("", 200), ("-wrong", 401)])
def test_dev_token_must_match_exactly(db, settings, suffix: str, expected: int) -> None:
    client = APIClient(HTTP_AUTHORIZATION=f"Bearer {settings.FAIR_DEV_TOKEN}{suffix}")

    assert client.get("/api/v1/user-state/").status_code == expected
