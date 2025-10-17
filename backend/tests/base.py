import json
import os
from unittest.mock import patch, MagicMock
from rest_framework import status
from rest_framework.test import APILiveServerTestCase, APITestCase, RequestsClient
from rest_framework.test import APIClient
from rest_framework.exceptions import AuthenticationFailed
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
    "access-token": "test-token-123",
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
        
        self.user = OsmUserFactory()
        self.dataset = DatasetFactory(user=self.user)
        self.aoi = AoiFactory(dataset=self.dataset, user=self.user)
        self.model = ModelFactory(dataset=self.dataset, user=self.user)
        
        def mock_authenticate(request):
            access_token = request.META.get("HTTP_ACCESS_TOKEN")
            if access_token == "test-token-123":
                return (self.user, None)
            return None
        
        self.auth_patcher = patch('login.authentication.OsmAuthentication.authenticate')
        self.mock_auth = self.auth_patcher.start()
        self.mock_auth.side_effect = mock_authenticate
        
        mock_celery_result = MagicMock()
        mock_celery_result.state = 'SUCCESS'
        mock_celery_result.info = {}
        mock_celery_result.result = None  
        mock_celery_result.traceback = None
        mock_celery_result.failed.return_value = False
        
        self.celery_patcher = patch('core.views.AsyncResult')
        self.mock_celery = self.celery_patcher.start()
        self.mock_celery.return_value = mock_celery_result
        
        self.cache_patcher = patch('core.views.cache')
        self.mock_cache = self.cache_patcher.start()
        self.mock_cache.get.return_value = None
        
        mock_predict_task = MagicMock()
        mock_predict_task.id = 'test-prediction-task-id'
        self.predict_patcher = patch('core.views.predict_area')
        self.mock_predict = self.predict_patcher.start()
        self.mock_predict.apply_async.return_value = mock_predict_task
        
        # Mock train_model task
        mock_train_task = MagicMock()
        mock_train_task.id = 'test-training-task-id'
        self.train_patcher = patch('core.tasks.train_model')
        self.mock_train = self.train_patcher.start()
        self.mock_train.apply_async.return_value = mock_train_task
        
    def tearDown(self):
        self.train_patcher.stop()
        self.predict_patcher.stop()
        self.cache_patcher.stop()
        self.celery_patcher.stop()
        self.auth_patcher.stop()
        super().tearDown()
        
    def post_json(self, url, data, headers=None, expect_status=None, method="POST"):
        """Helper method for JSON POST requests."""
        headers = headers or self.json_headers
        if method == "POST":
            response = self.client.post(url, json.dumps(data), headers=headers)
        elif method == "PATCH":
            response = self.client.patch(url, json.dumps(data), headers=headers)
        elif method == "PUT":
            response = self.client.put(url, json.dumps(data), headers=headers)
        else:
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