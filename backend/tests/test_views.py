from django.urls import reverse
from rest_framework import status
from .base import SimpleAPITestCase


class CoreViewsTest(SimpleAPITestCase):
    def test_home_api_info(self):
        res = self.client.get(self.get_api_url("/"))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("name", res.data)
        self.assertEqual(res.data["name"], "fAIr API")
        self.assertIn("version", res.data)
        self.assertIn("description", res.data)
        self.assertIn("documentation", res.data)
        self.assertIn("swagger", res.data["documentation"])
        self.assertIn("redoc", res.data["documentation"])
        self.assertIn("openapi_schema", res.data["documentation"])
        self.assertIn("api", res.data)
        self.assertIn("v1", res.data["api"])
