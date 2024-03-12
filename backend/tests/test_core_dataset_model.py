from core.models import Dataset
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
