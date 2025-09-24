import json
import os
from rest_framework import status
from rest_framework.test import APILiveServerTestCase, APITestCase, RequestsClient
from rest_framework.test import APIClient
from .factories import (
    OsmUserFactory,
    DatasetFactory,
    AoiFactory,
    ModelFactory,
    LabelFactory,
    TrainingFactory,
)


API_BASE = "http://testserver/api/v1"

DEFAULT_HEADERS = {
    "accept": "application/json",
    "access-token": os.environ.get("TESTING_TOKEN"),
}


class BaseAPITestCase(APILiveServerTestCase):
    """Base test case with common setup for API tests."""
    
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.api_base = API_BASE
        
    def setUp(self):
        self.client = RequestsClient()
        self.headers = DEFAULT_HEADERS.copy()
        self.json_headers = self.headers.copy()
        self.json_headers["content-type"] = "application/json"
        
        # Create common test objects
        self.user = OsmUserFactory()
        self.dataset = DatasetFactory(user=self.user)
        self.aoi = AoiFactory(dataset=self.dataset, user=self.user)
        self.model = ModelFactory(dataset=self.dataset, user=self.user)
        
    def post_json(self, url, data, headers=None, expect_status=None):
        """Helper method for JSON POST requests."""
        headers = headers or self.json_headers
        response = self.client.post(url, json.dumps(data), headers=headers)
        if expect_status:
            self.assertEqual(response.status_code, expect_status)
        return response
        
    def get_api_url(self, endpoint):
        """Helper to build API URLs."""
        return f"{self.api_base}/{endpoint.lstrip('/')}"


class SimpleAPITestCase(APITestCase):
    """Base test case for simple API tests without live server."""
    
    def setUp(self):
        self.client = APIClient()
        self.api_base = "/api"
        
    def get_api_url(self, endpoint):
        """Helper to build API URLs."""
        return f"{self.api_base}/{endpoint.lstrip('/')}"