from django.urls import reverse
from rest_framework import status
from .base import SimpleAPITestCase


class CoreViewsTest(SimpleAPITestCase):
    def test_home_redirect(self):
        res = self.client.get(self.get_api_url("/"))
        self.assertEqual(res.status_code, status.HTTP_302_FOUND)
        self.assertRedirects(res, reverse("schema-swagger-ui"))
