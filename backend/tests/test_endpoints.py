import validators
from django.conf import settings
from rest_framework import status
from rest_framework.test import APILiveServerTestCase, RequestsClient

API_BASE = "http://testserver/api/v1"

# Set the custom headers
headersList = {
    "accept": "application/json",
    "access-token": settings.TESTING_TOKEN,
}


class TaskApiTest(APILiveServerTestCase):
    def setUp(self):
        # Create a request factory instance
        self.client = RequestsClient()

    def test_auth_me(self):
        res = self.client.get(f"{API_BASE}/auth/me/", headers=headersList)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

    def test_auth_login(self):
        res = self.client.get(f"{API_BASE}/auth/login/")
        res_body = res.json()
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(validators.url(res_body["login_url"]), True)

    def test_create_dataset(self):
        payload = {
            "name": "My test dataset",
            "source_imagery": "https://tiles.openaerialmap.org/5ac4fc6f26964b0010033112/0/5ac4fc6f26964b0010033113/{z}/{x}/{y}",
        }
        # test without authentication should be forbidden
        res = self.client.post(f"{API_BASE}/dataset/", payload)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        # test with authentication should be passed
        res = self.client.post(f"{API_BASE}/dataset/", payload, headers=headersList)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
