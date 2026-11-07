"""Datasets 0006 and predictions 0008 move imagery into `{input name: url}` with its primary input, and back."""

import pytest
from django.db import connection
from django.db.migrations.executor import MigrationExecutor

BEFORE = [("datasets", "0005_dataset_category"), ("predictions", "0007_prediction_geometry")]
AFTER = [("datasets", "0006_dataset_imagery"), ("predictions", "0008_prediction_imagery")]
URL = "https://tiles.example/{z}/{x}/{y}"


def _migrate(targets):
    executor = MigrationExecutor(connection)
    executor.migrate(targets)
    return MigrationExecutor(connection).loader.project_state(targets).apps


def _user(apps, osm_id: int):
    """A user, plus the default dataset category a transactional test starts without."""
    apps.get_model("modelregistry", "Category").objects.get_or_create(slug="other", defaults={"label": "Other"})
    return apps.get_model("accounts", "OsmUser").objects.create(osm_id=osm_id, username="mapper")


@pytest.fixture
def restore_migrations():
    yield
    _migrate(AFTER)


@pytest.mark.django_db(transaction=True)
def test_imagery_migrations_keep_the_url_both_ways(restore_migrations):
    apps = _migrate(BEFORE)
    user = _user(apps, 1)
    apps.get_model("datasets", "Dataset").objects.create(stac_id="d1", title="D1", source_imagery=URL, user=user)
    apps.get_model("predictions", "Prediction").objects.create(
        local_model_stac_id="m", image_uri=URL, geometry={}, zoom=18, user=user
    )

    apps = _migrate(AFTER)
    dataset = apps.get_model("datasets", "Dataset").objects.get()
    prediction = apps.get_model("predictions", "Prediction").objects.get()
    assert (dataset.imagery, dataset.primary_input) == ({"image": URL}, "image")
    assert (prediction.imagery, prediction.primary_input) == ({"image": URL}, "image")

    apps = _migrate(BEFORE)
    assert apps.get_model("datasets", "Dataset").objects.get().source_imagery == URL
    assert apps.get_model("predictions", "Prediction").objects.get().image_uri == URL


@pytest.mark.parametrize(
    ("app", "model", "previous", "fields"),
    [
        ("datasets", "Dataset", "0005_dataset_category", {"stac_id": "d2", "title": "D2"}),
        ("predictions", "Prediction", "0007_prediction_geometry", {"local_model_stac_id": "m", "geometry": {}, "zoom": 18}),
    ],
)
@pytest.mark.django_db(transaction=True)
def test_reversing_imagery_with_two_inputs_fails_loud(restore_migrations, app, model, previous, fields):
    apps = _migrate(AFTER)
    user = _user(apps, 2)
    apps.get_model(app, model).objects.create(
        imagery={"post": URL, "pre": URL}, primary_input="post", user=user, **fields
    )

    with pytest.raises(RuntimeError, match="'post', 'pre'"):
        _migrate([(app, previous)])
