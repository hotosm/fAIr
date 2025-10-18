import factory
from core.models import (
    AOI,
    Dataset,
    Label,
    Model,
    Training,
)
from django.contrib.gis.geos import Polygon
from login.models import OsmUser


class OsmUserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = OsmUser

    osm_id = factory.Sequence(lambda n: 123456 + n)
    username = factory.Sequence(lambda n: f"testuser{n}")


class DatasetFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Dataset

    name = factory.Sequence(lambda n: f"Test dataset {n}")
    source_imagery = "https://tiles.openaerialmap.org/5ac4fc6f26964b0010033112/0/5ac4fc6f26964b0010033113/{z}/{x}/{y}"
    user = factory.SubFactory(OsmUserFactory)


class AoiFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = AOI

    geom = Polygon(
        (
            (32.588507094820351, 0.348666499011499),
            (32.588517512656978, 0.348184682976698),
            (32.588869114643053, 0.348171660921362),
            (32.588840465592334, 0.348679521066151),
            (32.588507094820351, 0.348666499011499),
        )
    )
    dataset = factory.SubFactory(DatasetFactory)


class LabelFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Label

    aoi = factory.SubFactory(AoiFactory)
    geom = Polygon(
        (
            (32.588507094820351, 0.348666499011499),
            (32.588517512656978, 0.348184682976698),
            (32.588869114643053, 0.348171660921362),
            (32.588840465592334, 0.348679521066151),
            (32.588507094820351, 0.348666499011499),
        )
    )


class ModelFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Model

    dataset = factory.SubFactory(DatasetFactory)
    name = factory.Sequence(lambda n: f"Test model {n}")
    user = factory.SubFactory(OsmUserFactory)


class TrainingFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Training

    model = factory.SubFactory(ModelFactory)
    description = factory.Sequence(lambda n: f"Test training {n}")
    user = factory.SubFactory(OsmUserFactory)
    epochs = 1
    zoom_level = [20, 21]
    batch_size = 1


class FeedbackFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = "core.Feedback"

    training = factory.SubFactory(TrainingFactory)
    user = factory.SubFactory(OsmUserFactory)
    action = "ACCEPT"
    geom = Polygon(
        (
            (32.588507094820351, 0.348666499011499),
            (32.588517512656978, 0.348184682976698),
            (32.588869114643053, 0.348171660921362),
            (32.588840465592334, 0.348679521066151),
            (32.588507094820351, 0.348666499011499),
        )
    )


class PredictionFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = "core.Prediction"

    user = factory.SubFactory(OsmUserFactory)
    geom = Polygon(
        (
            (32.588507094820351, 0.348666499011499),
            (32.588517512656978, 0.348184682976698),
            (32.588869114643053, 0.348171660921362),
            (32.588840465592334, 0.348679521066151),
            (32.588507094820351, 0.348666499011499),
        )
    )
    config = {
        "checkpoint": "test-checkpoint",
        "zoom_level": 20,
        "source": "https://tiles.openaerialmap.org/test/{z}/{x}/{y}"
    }


class UserNotificationFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = "core.UserNotification"

    user = factory.SubFactory(OsmUserFactory)
    message = factory.Sequence(lambda n: f"Notification message {n}")
    is_read = False


