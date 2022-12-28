import json
import os

import validators
from django.conf import settings
from rest_framework import status
from rest_framework.test import APILiveServerTestCase, RequestsClient

API_BASE = "http://testserver/api/v1"

# Set the custom headers
headersList = {
    "accept": "application/json",
    "access-token": "LmVKeUZqMDF6bXpBQVJQOUtoM05pSkJCZ1BKTkRJVEdHeEUyS1UyeDg4ZWdMSTBDQ1NzVFU3dVNfaDB2UFBlN3N6TzU3ZnkzQnJGVUFBSUlPdXJNLUROY0tTMjZ0ckdkVGkxSGNORzYtN1dxc0piYnVMQ0hQcHdfZHpXMDlqb05aMmZZMFRZdC00TXFNbXZOUjRtSFI2N090c2VpTWpla29MdnhreGw3ak03YzFIelEzWEkxNEZMMHljMlpDY3pyYV9KcFZWSzRIc3RtS1YyVUUyUmMzNnF6VmNaZjZhWnRGZUJORkx6ZUc4b1NHYjd2VXBMSkFORTU5b2dwRDRrblFUWEZObTE2VThzLWw3TUxoR0dkaDlmUGg0ZjRldU1TaEJHS1hVSVRBRW5sdWdDdUNmSl82TUFnREQ3a01jSGZKX29fd3lHSXV3LTFlQW9fdnMwUGVSTy1fUUplVmV5OG1iZmFiQUxZcnVpY25iLXRua215djVQR0lpNmFkeXViSm0zY08yMFBVNXVwSFdoYk0wR1NkdjcwRDhSSm5IZDk4RjZfU2d5U1pUS29pU01YOHA0NDFsVjNOa3U1Q3hEOFZ5QnlITEJtYTRaY3VkZ0tIUVJ4V0ZVQXVBck1YeFFGMUEwU1FuVzZUa3dNY0FEd1luQ0QwQWhBc211RnNmWDRCdXVLZ29RLlRsR244MGpPMHRJaDgzUXVYc2NaODVnYWlUMA==",
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

        # now dataset is created , create first aoi inside it
        payload_second = {
            "geom": {
                "type": "Polygon",
                "coordinates": [
                    [
                        [32.588507094820351, 0.348666499011499],
                        [32.588517512656978, 0.348184682976698],
                        [32.588869114643053, 0.348171660921362],
                        [32.588840465592334, 0.348679521066151],
                        [32.588507094820351, 0.348666499011499],
                    ]
                ],
            },
            "dataset": 1,
        }
        json_type_header = headersList
        json_type_header["content-type"] = "application/json"
        res = self.client.post(
            f"{API_BASE}/aoi/", json.dumps(payload_second), headers=json_type_header
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

        # create second aoi too , to test multiple aois
        payload_third = {
            "geom": {
                "type": "Polygon",
                "coordinates": [
                    [
                        [32.588046105549715, 0.349843692679227],
                        [32.588225813231475, 0.349484284008701],
                        [32.588624295482369, 0.349734307433132],
                        [32.588371662944233, 0.350088507273009],
                        [32.588046105549715, 0.349843692679227],
                    ]
                ],
            },
            "dataset": 1,
        }
        res = self.client.post(
            f"{API_BASE}/aoi/", json.dumps(payload_third), headers=json_type_header
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

        # download labels from osm for 1

        res = self.client.post(
            f"{API_BASE}/label/osm/fetch/1/", "", headers=headersList
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

        # download labels from osm for 2

        res = self.client.post(
            f"{API_BASE}/label/osm/fetch/2/", "", headers=headersList
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

        # build the dataset

        build_dt_payload = {"dataset_id": 1, "zoom_level": ["19"]}
        res = self.client.post(
            f"{API_BASE}/dataset/image/build/",
            json.dumps(build_dt_payload),
            headers=json_type_header,
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

        # build dataset on multiple zoom levels

        build_dt_payload = {"dataset_id": 1, "zoom_level": ["19", "20"]}
        res = self.client.post(
            f"{API_BASE}/dataset/image/build/",
            json.dumps(build_dt_payload),
            headers=json_type_header,
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

        # create model

        model_payload = {"name": "My test model", "dataset": 1}
        res = self.client.post(
            f"{API_BASE}/model/", json.dumps(model_payload), headers=json_type_header
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

        # create training inside model
        training_payload = {
            "description": "My very first training",
            "epochs": 1,
            "batch_size": 1,
            "model": 1,
        }
        res = self.client.post(
            f"{API_BASE}/training/",
            json.dumps(training_payload),
            headers=json_type_header,
        )
        print(res.json())
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        # test
