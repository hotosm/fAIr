from unittest.mock import patch, MagicMock, Mock
from rest_framework import status
from .base import BaseAPITestCase


class MapswipeProjectViewSetTest(BaseAPITestCase):
    """Simple test cases for MapSwipe integration."""

    def setUp(self):
        super().setUp()
        self.mapswipe_create_url = self.get_api_url("/mapswipe-project/")
        self.valid_payload = {
            "topic": "Building Validation",
            "region": "Nepal",
            "description": "Validate building footprints",
            "instruction": "Check if buildings match imagery",
            "look_for": "buildings",
            "geojson_url": "https://fair-dev.hotosm.org/api/v1/workspace/download/training_1142/labels.geojson/",
            "tms_url": "https://tiles.openaerialmap.org/68bed3070dea6f775adb9b06/0/68bed3070dea6f775adb9b07/{z}/{x}/{y}"
        }
    @patch('core.views.get_object_or_404')
    @patch('core.views.settings')
    @patch('core.views.MapswipeClient')
    def test_create_and_retrieve_mapswipe_project(self, mock_client, mock_settings,mock_get_obj):
        """Test full workflow: create project then retrieve its status."""
        mock_settings.MAPSWIPE_BACKEND_URL = "http://test.mapswipe.org"
        mock_settings.MAPSWIPE_MANAGER_URL = "http://manager.test"
        mock_settings.MAPSWIPE_FB_AUTH_URL = "http://auth.test"
        mock_settings.MAPSWIPE_FB_USERNAME = "test"
        mock_settings.MAPSWIPE_FB_PASSWORD = "test"
        mock_settings.MAPSWIPE_CSRFTOKEN_KEY = "test-key"
        mock_settings.MAPSWIPE_ORGANIZATION_ID = "1"
        
        instance = MagicMock()
        mock_client.return_value.__enter__.return_value = instance
        
        project_id = "test-project-123"
        instance.create_validation_project.return_value = (project_id, "asset-456")
        instance.update_project.return_value = {"result": {"id": project_id}, "errors": None}
        instance.update_project_status.return_value = {
            "result": {"id": project_id, "status": "READY_TO_PROCESS"},
            "errors": None
        }
        
        
        pred_mock = MagicMock()
        pred_mock.id = 1
        pred_mock.mapswipe_id = project_id
        pred_mock.result = None
        mock_get_obj.return_value = pred_mock

        
        
        res = self.post_json(self.mapswipe_create_url, self.valid_payload)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        data = res.json()
        self.assertEqual(data["code"], "SUCCESS")
        self.assertEqual(data["data"]["project_id"], project_id)
        self.assertEqual(data["data"]["status"], "READY_TO_PROCESS")
        
        instance.get_project_details.return_value = {
            "id": project_id,
            "status": "PROCESSED",
            "region": "Nepal"
        }
        
        res = self.client.get(
            self.get_api_url(f"/mapswipe-project/{project_id}/"),
            headers=self.headers
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.json()["data"]["status"], "PROCESSED")

    def test_create_with_missing_fields(self):
        """Test validation with missing required fields."""
        res = self.post_json(self.mapswipe_create_url, {"topic": "Test"})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    @patch('core.views.settings')
    @patch('core.views.MapswipeClient')
    def test_external_service_error(self, mock_client, mock_settings):
        """Test handling of MapSwipe service errors."""
        mock_settings.MAPSWIPE_ORGANIZATION_ID = "1"
        instance = MagicMock()
        mock_client.return_value.__enter__.return_value = instance
        instance.create_validation_project.side_effect = RuntimeError("Service error")

        res = self.post_json(self.mapswipe_create_url, self.valid_payload)
        self.assertEqual(res.status_code, status.HTTP_502_BAD_GATEWAY)
        self.assertEqual(res.json()["code"], "EXTERNAL_SERVICE_ERROR")

    @patch('core.views.MapswipeClient')
    def test_project_not_found(self, mock_client):
        """Test 404 when project doesn't exist."""
        instance = MagicMock()
        mock_client.return_value.__enter__.return_value = instance
        
        import httpx
        mock_response = Mock()
        mock_response.status_code = 404
        instance.get_project_details.side_effect = httpx.HTTPStatusError(
            "Not Found", request=Mock(), response=mock_response
        )

        res = self.client.get(
            self.get_api_url("/mapswipe-project/invalid-id/"),
            headers=self.headers
        )
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(res.json()["code"], "NOT_FOUND")
