from core.models import (
    AOI,
    Dataset,
    Feedback,
    FeedbackAOI,
    FeedbackLabel,
    Label,
    Model,
    Training,
)
from django.contrib.gis.geos import Polygon
from django.test import TestCase
from login.models import OsmUser


class DatasetModelTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        # Set up non-modified objects used by all test methods
        cls.osm_user = OsmUser.objects.create(osm_id="123456789", username="testuser")
        cls.dataset = Dataset.objects.create(
            name="Test Dataset",
            created_by=cls.osm_user,
            source_imagery="http://example.com/image.png",
        )

    def test_dataset_creation(self):
        # Test the Dataset instance has been created properly.
        self.assertTrue(isinstance(self.dataset, Dataset))

    def test_string_representation(self):
        # Test the string representation of a Dataset instance
        self.assertEqual(str(self.dataset), "Test Dataset")

    def test_invalid_dataset_creation(self):
        # Raise an exception if an invalid dataset is created
        with self.assertRaises(Exception):
            self.dataset = Dataset.objects.create(
                name="Test Dataset",
                created_by=None,
                source_imagery="http://example.com/image.png",
                status=Dataset.DatasetStatus.ACTIVE,
            )

    def test_default_dataset_status(self):
        # Test the default dataset status is DRAFT
        self.assertEqual(self.dataset.status, Dataset.DatasetStatus.DRAFT)

    def test_dataset_fields(self):
        # Test all fields for correct values
        self.assertEqual(self.dataset.name, "Test Dataset")
        self.assertEqual(self.dataset.created_by, self.osm_user)
        self.assertEqual(self.dataset.source_imagery, "http://example.com/image.png")
        # Ensure auto_now_add fields are populated
        self.assertIsNotNone(self.dataset.created_at)
        # Ensure auto_now fields are populated
        self.assertIsNotNone(self.dataset.last_modified)


class AOIModelTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        # Set up non-modified objects used by all test methods
        cls.osm_user = OsmUser.objects.create(osm_id="123456789", username="testuser")
        cls.aoi = AOI.objects.create(
            dataset=Dataset.objects.create(
                name="Test Dataset",
                created_by=cls.osm_user,
                source_imagery="http://example.com/image.png",
            ),
            geom=Polygon(
                ((0, 0), (0, 1), (1, 1), (1, 0), (0, 0)),
                ((0.4, 0.4), (0.4, 0.6), (0.6, 0.6), (0.6, 0.4), (0.4, 0.4)),
            ),
        )

    def test_AOI_creation(self):
        # Test the AOI instance has been created properly.
        self.assertTrue(isinstance(self.aoi, AOI))

    def test_string_representation(self):
        # Test the string representation of an AOI instance
        self.assertEqual(
            str(self.aoi),
            f"Test Dataset - {self.aoi.geom}",
        )

    def test_invalid_AOI_creation(self):
        # Raise an exception if an invalid AOI is created
        with self.assertRaises(Exception):
            self.aoi = AOI.objects.create(
                dataset=None,
                geom=Polygon(
                    ((0, 0), (0, 1), (1, 1), (1, 0), (0, 0)),
                    ((0.4, 0.4), (0.4, 0.6), (0.6, 0.6), (0.6, 0.4), (0.4, 0.4)),
                ),
                label_status=AOI.DownloadStatus.DOWNLOADED,
            )

    def test_default_label_status(self):
        # The default label status should be NOT_DOWNLOADED
        self.assertEqual(self.aoi.label_status, AOI.DownloadStatus.NOT_DOWNLOADED)


class LabelModelTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        # Set up non-modified objects used by all test methods
        cls.osm_user = OsmUser.objects.create(osm_id="123456789", username="testuser")
        cls.aoi = AOI.objects.create(
            dataset=Dataset.objects.create(
                name="Test Dataset",
                created_by=cls.osm_user,
                source_imagery="http://example.com/image.png",
                status=Dataset.DatasetStatus.ACTIVE,
            ),
            geom=Polygon(
                ((0, 0), (0, 1), (1, 1), (1, 0), (0, 0)),
                ((0.4, 0.4), (0.4, 0.6), (0.6, 0.6), (0.6, 0.4), (0.4, 0.4)),
            ),
        )
        cls.label = Label.objects.create(
            aoi=cls.aoi,
            geom=Polygon(
                ((0, 0), (0, 1), (1, 1), (1, 0), (0, 0)),
                ((0.4, 0.4), (0.4, 0.6), (0.6, 0.6), (0.6, 0.4), (0.4, 0.4)),
            ),
            osm_id=123456789,
            tags={"key": "value"},
        )

    def test_label_creation(self):
        # Test the Label instance has been created properly.
        self.assertTrue(isinstance(self.label, Label))

    def test_string_representation(self):
        # Test the string representation of an Label instance
        self.assertEqual(
            str(self.label),
            f"{self.label.aoi} - {self.label.geom}",
        )

    def test_invalid_label_creation(self):
        # Raise an exception if an invalid label is created
        with self.assertRaises(Exception):
            self.label = Label.objects.create(
                aoi=None,
                geom=Polygon(
                    ((0, 0), (0, 1), (1, 1), (1, 0), (0, 0)),
                    ((0.4, 0.4), (0.4, 0.6), (0.6, 0.6), (0.6, 0.4), (0.4, 0.4)),
                ),
                osm_id=123456789,
                tags={"key": "value"},
            )

    def test_created_at_field(self):
        # Test the created_by field is not empty
        self.assertIsNotNone(self.label.created_at)


class ModelTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        # Set up non-modified objects used by all test methods
        cls.osm_user = OsmUser.objects.create(osm_id="123456789", username="testuser")
        cls.dataset = Dataset.objects.create(
            name="Test Dataset",
            created_by=cls.osm_user,
            source_imagery="http://example.com/image.png",
        )
        cls.model = Model.objects.create(
            name="Test Model",
            created_by=cls.osm_user,
            dataset=cls.dataset,
        )

    def test_model_creation(self):
        # Test the Model instance has been created properly.
        self.assertTrue(isinstance(self.model, Model))

    def test_invalid_model_creation(self):
        # Raise an exception if an invalid model is created
        with self.assertRaises(Exception):
            self.model = Model.objects.create(
                name="Test Model",
                created_by=None,
                dataset=self.dataset,
            )

    def test_string_representation(self):
        # Test the string representation of a Model instance
        self.assertEqual(str(self.model), self.model.name)

    def test_created_by_field(self):
        # Test the created_by field is not empty
        self.assertIsNotNone(self.model.created_by)


class TrainingModelTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        # Set up non-modified objects used by all test methods
        cls.osm_user = OsmUser.objects.create(osm_id="123456789", username="testuser")
        cls.dataset = Dataset.objects.create(
            name="Test Dataset",
            created_by=cls.osm_user,
        )
        cls.model = Model.objects.create(
            name="Test Model",
            created_by=cls.osm_user,
            dataset=cls.dataset,
        )
        cls.training = Training.objects.create(
            model=cls.model,
            zoom_level=[19, 20, 21, 22],
            created_by=cls.osm_user,
            epochs=10,
            batch_size=32,
        )
        cls.source_imagery = "http://example.com/image.png"
        cls.description = "Test description"

    def test_training_creation(self):
        # Test the training instance has been created properly.
        self.assertTrue(isinstance(self.training, Training))
        self.assertIsNotNone(self.training)

    def test_string_representation(self):
        # Test the string representation of an AOI instance
        self.assertEqual(str(self.training), (self.model.name))

    def test_default_training_status(self):
        # Test the default status is "SUBMITTED"
        self.assertEqual(self.training.status, "SUBMITTED")


class FeedbackModelTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        # Set up non-modified objects used by all test methods
        cls.osm_user = OsmUser.objects.create(osm_id="123456789", username="testuser")
        cls.model = Model.objects.create(
            name="Test Model",
            created_by=cls.osm_user,
            dataset=Dataset.objects.create(
                name="Test Dataset",
                created_by=cls.osm_user,
            ),
        )
        cls.feedback = Feedback.objects.create(
            user=cls.osm_user,
            training=Training.objects.create(
                model=cls.model,
                zoom_level=[19, 20, 21, 22],
                created_by=cls.osm_user,
                epochs=10,
                batch_size=32,
            ),
            geom=Polygon(
                ((0, 0), (0, 1), (1, 1), (1, 0), (0, 0)),
                ((0.4, 0.4), (0.4, 0.6), (0.6, 0.6), (0.6, 0.4), (0.4, 0.4)),
            ),
            zoom_level=19,
            source_imagery="http://example.com/image.png",
        )

    def test_feedback_creation(self):
        # Test the feedback instance has been created properly.
        self.assertTrue(isinstance(self.feedback, Feedback))
        self.assertIsNotNone(self.feedback)

    def test_string_representation(self):
        # Test the string representation of a Feedback instance
        self.assertEqual(
            str(self.feedback),
            f"{self.feedback.user} - {self.feedback.training} - {self.feedback.feedback_type}",
        )

    def test_created_at_field(self):
        # Test the created_at field is not empty
        self.assertIsNotNone(self.feedback.created_at)


class FeedbackAOITest(TestCase):
    @classmethod
    def setUpTestData(cls):
        # Set up non-modified objects used by all test methods
        cls.osm_user = OsmUser.objects.create(osm_id="123456789", username="testuser")
        cls.dataset = Dataset.objects.create(
            name="Test Dataset",
            created_by=cls.osm_user,
        )
        cls.model = Model.objects.create(
            name="Test Model",
            created_by=cls.osm_user,
            dataset=cls.dataset,
        )
        cls.training = Training.objects.create(
            model=cls.model,
            zoom_level=[19, 20, 21, 22],
            created_by=cls.osm_user,
            epochs=10,
            batch_size=32,
        )
        cls.feedbackAOI = FeedbackAOI.objects.create(
            user=cls.osm_user,
            training=cls.training,
            source_imagery="http://example.com/aoi_image.png",
            geom=Polygon(
                ((0, 0), (0, 1), (1, 1), (1, 0), (0, 0)),
                ((0.4, 0.4), (0.4, 0.6), (0.6, 0.6), (0.6, 0.4), (0.4, 0.4)),
            ),
        )

    def test_feedback_aoi_creation(self):
        # Test the feedback aoi instance has been created properly.
        self.assertTrue(isinstance(self.feedbackAOI, FeedbackAOI))
        self.assertIsNotNone(self.feedbackAOI)

    def test_string_representation(self):
        # Test the string representation of a FeedbackAOI instance
        self.assertEqual(
            str(self.feedbackAOI),
            f"{self.feedbackAOI.user} - {self.feedbackAOI.training} - {self.feedbackAOI.source_imagery}",
        )


class FeedbackLabelTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        # Set up non-modified objects used by all test methods
        cls.osm_user = OsmUser.objects.create(
            osm_id="987654321", username="feedbacklabeluser"
        )
        cls.dataset = Dataset.objects.create(
            name="Feedback Label Dataset",
            created_by=cls.osm_user,
        )
        cls.model = Model.objects.create(
            name="Feedback Label Model",
            created_by=cls.osm_user,
            dataset=cls.dataset,
        )
        cls.training = Training.objects.create(
            model=cls.model,
            zoom_level=[19, 20, 21, 22],
            created_by=cls.osm_user,
            epochs=5,
            batch_size=16,
        )
        cls.feedbackAOI = FeedbackAOI.objects.create(
            user=cls.osm_user,
            training=cls.training,
            source_imagery="http://example.com/feedback_aoi_image.png",
            geom=Polygon(
                ((0, 0), (0, 2), (2, 2), (2, 0), (0, 0)),
                ((0.5, 0.5), (0.5, 1.5), (1.5, 1.5), (1.5, 0.5), (0.5, 0.5)),
            ),
        )
        cls.feedbackLabel = FeedbackLabel.objects.create(
            osm_id=123456789,
            feedback_aoi=cls.feedbackAOI,
            tags={"natural": "tree"},
            geom=Polygon(((0.5, 0.5), (0.5, 1.5), (1.5, 1.5), (1.5, 0.5), (0.5, 0.5))),
        )

    def test_feedback_label_creation(self):
        # Test the feedback label instance has been created properly.
        self.assertTrue(isinstance(self.feedbackLabel, FeedbackLabel))
        self.assertIsNotNone(self.feedbackLabel)

    def test_feedback_label_fields(self):
        # Test the fields of the feedback label instance
        self.assertEqual(self.feedbackLabel.osm_id, 123456789)
        self.assertEqual(self.feedbackLabel.feedback_aoi, self.feedbackAOI)
        self.assertEqual(self.feedbackLabel.tags, {"natural": "tree"})
        self.assertTrue(isinstance(self.feedbackLabel.geom, Polygon))
