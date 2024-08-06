from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

BASE_URL = "http://testserver/api"


class CoreViewsTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.home_url = f"{BASE_URL}/"

    def test_home_redirect(self):
        res = self.client.get(self.home_url)
        self.assertEqual(res.status_code, status.HTTP_302_FOUND)
        self.assertRedirects(res, reverse("schema-swagger-ui"))
