import ipaddress
import socket

import pytest
from django.test import Client
from rest_framework.test import APIClient

from accounts.models import OsmUser

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


@pytest.fixture(scope="session")
def _empty_static_dir(tmp_path_factory: pytest.TempPathFactory) -> str:
    return str(tmp_path_factory.mktemp("static"))


@pytest.fixture(autouse=True)
def _static_root(settings, _empty_static_dir: str) -> None:
    settings.STATIC_ROOT = _empty_static_dir


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


@pytest.fixture
def user(db) -> OsmUser:
    return OsmUser.objects.create(osm_id=1001, username="alice")


@pytest.fixture
def admin_user(db) -> OsmUser:
    return OsmUser.objects.create(osm_id=1002, username="root", is_staff=True)


@pytest.fixture
def other_user(db) -> OsmUser:
    return OsmUser.objects.create(osm_id=1003, username="eve")


@pytest.fixture
def client(user: OsmUser) -> APIClient:
    api = APIClient()
    api.force_authenticate(user=user)
    return api


@pytest.fixture
def admin_client(admin_user: OsmUser) -> APIClient:
    api = APIClient()
    api.force_authenticate(user=admin_user)
    return api


@pytest.fixture
def anon_client() -> APIClient:
    return APIClient()


@pytest.fixture
def admin_site(db) -> Client:
    client = Client()
    client.force_login(
        OsmUser.objects.create(osm_id=1004, username="superuser", is_staff=True, is_superuser=True)
    )
    return client
