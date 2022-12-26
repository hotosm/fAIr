from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient


class TaskApiTest(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_get_task_list(self):
        res = self.client.get("/api/v1/dataset/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
