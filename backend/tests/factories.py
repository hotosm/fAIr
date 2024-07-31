import factory
from login.models import OsmUser
from django.contrib.gis.geos import Polygon
from core.models import (
    Dataset,
    AOI,
    Label,
    Model,
    Training,
    Feedback,
    FeedbackAOI,
    FeedbackLabel,
)


class OsmUserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = OsmUser

    osm_id = 123456


class DatasetFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Dataset

    name = "My test dataset"
    source_imagery = "https://tiles.openaerialmap.org/5ac4fc6f26964b0010033112/0/5ac4fc6f26964b0010033113/{z}/{x}/{y}"
    created_by = factory.SubFactory(OsmUserFactory)


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
    name = "My test model"
    created_by = factory.SubFactory(OsmUserFactory)


class TrainingFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Training

    model = factory.SubFactory(ModelFactory)
    description = "My very first training"
    created_by = factory.SubFactory(OsmUserFactory)
    epochs = 1
    zoom_level = [20, 21]
    batch_size = 1


class FeedbackFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Feedback

    geom = Polygon(
        (
            (32.588507094820351, 0.348666499011499),
            (32.588517512656978, 0.348184682976698),
            (32.588869114643053, 0.348171660921362),
            (32.588840465592334, 0.348679521066151),
            (32.588507094820351, 0.348666499011499),
        )
    )
    training = factory.SubFactory(TrainingFactory)
    zoom_level = 19
    feedback_type = "TP"
    user = factory.SubFactory(OsmUserFactory)
    source_imagery = "https://tiles.openaerialmap.org/5ac4fc6f26964b0010033112/0/5ac4fc6f26964b0010033113/{z}/{x}/{y}"


class FeedbackAoiFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = FeedbackAOI

    training = factory.SubFactory(TrainingFactory)
    geom = Polygon(
        (
            (32.588507094820351, 0.348666499011499),
            (32.588517512656978, 0.348184682976698),
            (32.588869114643053, 0.348171660921362),
            (32.588840465592334, 0.348679521066151),
            (32.588507094820351, 0.348666499011499),
        )
    )
    label_status = -1
    source_imagery = "https://tiles.openaerialmap.org/5ac4fc6f26964b0010033112/0/5ac4fc6f26964b0010033113/{z}/{x}/{y}"
    user = factory.SubFactory(OsmUserFactory)


class FeedbackLabelFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = FeedbackLabel

    feedback_aoi = factory.SubFactory(FeedbackAoiFactory)
    geom = Polygon(
        (
            (32.588507094820351, 0.348666499011499),
            (32.588517512656978, 0.348184682976698),
            (32.588869114643053, 0.348171660921362),
            (32.588840465592334, 0.348679521066151),
            (32.588507094820351, 0.348666499011499),
        )
    )
