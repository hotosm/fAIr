import validators
from django.conf import settings
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

API_BASE = "http://testserver/api/v1"

headersList = {
    "accept": "application/json",
    "access-token": "LmVKeUZqMDF6bXpBQVJQOUtoM05pSkJCZ1BKTkRJVEdHeEUyS1UyeDg4ZWdMSTBDQ1NzVFU3dVNfaDB2UFBlN3N6TzU3ZnkzQnJGVUFBSUlPdXJNLUROY0tTMjZ0ckdkVGkxSGNORzYtN1dxc0piYnVMQ0hQcHdfZHpXMDlqb05aMmZZMFRZdC00TXFNbXZOUjRtSFI2N090c2VpTWpla29MdnhreGw3ak03YzFIelEzWEkxNEZMMHljMlpDY3pyYV9KcFZWSzRIc3RtS1YyVUUyUmMzNnF6VmNaZjZhWnRGZUJORkx6ZUc4b1NHYjd2VXBMSkFORTU5b2dwRDRrblFUWEZObTE2VThzLWw3TUxoR0dkaDlmUGg0ZjRldU1TaEJHS1hVSVRBRW5sdWdDdUNmSl82TUFnREQ3a01jSGZKX29fd3lHSXV3LTFlQW9fdnMwUGVSTy1fUUplVmV5OG1iZmFiQUxZcnVpY25iLXRua215djVQR0lpNmFkeXViSm0zY08yMFBVNXVwSFdoYk0wR1NkdjcwRDhSSm5IZDk4RjZfU2d5U1pUS29pU01YOHA0NDFsVjNOa3U1Q3hEOFZ5QnlITEJtYTRaY3VkZ0tIUVJ4V0ZVQXVBck1YeFFGMUEwU1FuVzZUa3dNY0FEd1luQ0QwQWhBc211RnNmWDRCdXVLZ29RLlRsR244MGpPMHRJaDgzUXVYc2NaODVnYWlUMA==",
}

# Set the custom header


class TaskApiTest(APITestCase):
    def setUp(self):
        # Create a request factory instance
        self.client = APIClient()

    def test_auth_me(self):
        client = APIClient()
        res = client.get(f"{API_BASE}/auth/me/", headers=headersList)
        # print(res.request.__dict__)
        print(res.request)
        print(res.json())
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_auth_login(self):
        res = self.client.get(f"{API_BASE}/auth/login/")
        res_body = res.json()
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(validators.url(res_body["login_url"]), True)

    def test_get_task_list(self):
        res = self.client.get(f"{API_BASE}/dataset/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
