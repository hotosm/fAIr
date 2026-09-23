import pytest

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
