from types import SimpleNamespace

from accounts.authentication import HankoAuthentication


def test_hanko_returns_none_for_anonymous() -> None:
    """No Hanko user must yield a bare None so DRF falls back to AnonymousUser.

    Returning a ``(None, None)`` tuple sets ``request.user = None`` and crashes
    any downstream ``request.user.is_authenticated`` check.
    """
    request = SimpleNamespace(hotosm=SimpleNamespace(user=None))
    assert HankoAuthentication().authenticate(request) is None
