import ipaddress
import socket

import pytest

PUBLIC_TEST_ADDRESS = "93.184.215.14"

_DB_FIXTURES = frozenset({"db", "transactional_db", "django_db_reset_sequences"})


def pytest_collection_modifyitems(items: list[pytest.Item]) -> None:
    """Tag DB-backed tests with `django_db` from their fixtures, so pre-push runs
    `-m "not django_db"` without Postgres while CI runs the full suite.

    This set mirrors pytest-django's own gate for Django ORM access, so a test that
    reaches the database without one of these fixtures already fails CI as "Database
    access not allowed"; the heuristic cannot hide a DB test from the DB-free subset.
    """
    for item in items:
        if _DB_FIXTURES.intersection(item.fixturenames):
            item.add_marker(pytest.mark.django_db)


@pytest.fixture(autouse=True)
def _resolve_test_hosts(monkeypatch: pytest.MonkeyPatch) -> None:
    """Test hostnames such as tiles.example map to a public address, while IP literals and
    localhost keep their own, so the public-URL check sees what a test intends."""

    def resolve(host: str, port: int, *args, type: int = 0, **kwargs) -> list:
        if host == "localhost":
            host = "127.0.0.1"
        try:
            address = ipaddress.ip_address(host)
        except ValueError:
            address = ipaddress.ip_address(PUBLIC_TEST_ADDRESS)
        family = socket.AF_INET6 if address.version == 6 else socket.AF_INET
        return [(family, type, 6, "", (str(address), port))]

    monkeypatch.setattr(socket, "getaddrinfo", resolve)
