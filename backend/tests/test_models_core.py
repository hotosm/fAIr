from core.models import AOI, Dataset
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
            status=Dataset.DatasetStatus.ACTIVE,
        )

    def test_dataset_creation(self):
        # Test the Dataset instance has been created properly.
        self.assertTrue(isinstance(self.dataset, Dataset))
        self.assertEqual(self.dataset.__str__(), self.dataset.name)

    def test_invalid_dataset_creation(self):
        # Raise an exception if an invalid dataset is created
        with self.assertRaises(Exception):
            self.dataset = Dataset.objects.create(
                name="Test Dataset",
                created_by=None,
                source_imagery="http://example.com/image.png",
                status=Dataset.DatasetStatus.ACTIVE,
            )

    def test_dataset_status(self):
        # Test the status field works as expected
        self.assertEqual(self.dataset.status, Dataset.DatasetStatus.ACTIVE)

    def test_dataset_fields(self):
        # Test all fields for correct values
        self.assertEqual(self.dataset.name, "Test Dataset")
        self.assertEqual(self.dataset.created_by, self.osm_user)
        self.assertEqual(self.dataset.source_imagery, "http://example.com/image.png")
        self.assertEqual(self.dataset.status, Dataset.DatasetStatus.ACTIVE)
        # Ensure auto_now_add fields are populated
        self.assertIsNotNone(self.dataset.created_at)
        # Ensure auto_now fields are populated
        self.assertIsNotNone(self.dataset.last_modified)

    def test_string_representation(self):
        # Test the string representation of a Dataset instance
        self.assertEqual(str(self.dataset), "Test Dataset")


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
                status=Dataset.DatasetStatus.ACTIVE,
            ),
            geom=Polygon(
                ((0, 0), (0, 1), (1, 1), (1, 0), (0, 0)),
                ((0.4, 0.4), (0.4, 0.6), (0.6, 0.6), (0.6, 0.4), (0.4, 0.4)),
            ),
        )

    def test_aoi_creation(self):
        # Test the AOI instance has been created properly.
        self.assertTrue(isinstance(self.aoi, AOI))
        self.assertEqual(
            self.aoi.__str__(), f"{self.aoi.dataset.name} - {self.aoi.geom}"
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
