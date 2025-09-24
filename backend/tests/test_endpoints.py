import json
import os
import shutil

import validators
from django.conf import settings
from rest_framework import status

from .base import BaseAPITestCase
from .factories import (
    LabelFactory,
    TrainingFactory,
)


class TaskApiTest(BaseAPITestCase):

    def test_auth_me(self):
        res = self.client.get(self.get_api_url("/auth/me/"), headers=self.headers)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

    def test_auth_login(self):
        res = self.client.get(self.get_api_url("/auth/login/"))
        res_body = res.json()
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(validators.url(res_body["login_url"]), True)

    def test_create_dataset(self):
        payload = {
            "name": self.dataset.name,
            "source_imagery": self.dataset.source_imagery,
        }
        res = self.client.post(self.get_api_url("/dataset/"), payload)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        res = self.client.post(self.get_api_url("/dataset/"), payload, headers=self.headers)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

    def test_create_training(self):
        payload_second = {"geom": self.aoi.geom.json, "dataset": self.dataset.id}

        res = self.post_json(self.get_api_url("/aoi/"), payload_second)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

        payload_third = {
            "geom": self.aoi.geom.json,
            "dataset": self.dataset.id,
        }
        res = self.post_json(self.get_api_url("/aoi/"), payload_third)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

        model_payload = {"name": self.model.name, "dataset": self.dataset.id}
        res = self.post_json(self.get_api_url("/model/"), model_payload)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

        training_payload = {
            "description": "My very first training",
            "epochs": 1,
            "zoom_level": [20, 21],
            "batch_size": 1,
            "model": self.model.id,
        }
        res = self.post_json(self.get_api_url("training/"), training_payload)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

        res = self.client.post(
            self.get_api_url(f"/label/osm/fetch/{self.aoi.id}/"), "", headers=self.headers
        )
        self.assertEqual(res.status_code, 202)

        res = self.client.post(
            self.get_api_url(f"/label/osm/fetch/{self.aoi.id}/"), "", headers=self.headers
        )
        self.assertEqual(res.status_code, 202)

        training_payload = {
            "description": "My very first training",
            "epochs": 31,
            "zoom_level": [20, 21],
            "batch_size": 1,
            "model": self.model.id,
        }
        res = self.post_json(self.get_api_url("training/"), training_payload)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

        training_payload = {
            "description": "My very first training",
            "epochs": 1,
            "zoom_level": [20, 21],
            "batch_size": 9,
            "model": self.model.id,
        }
        res = self.post_json(self.get_api_url("training/"), training_payload)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

        training_payload = {
            "description": "My very first training",
            "epochs": 1,
            "zoom_level": [20, 21],
            "batch_size": 1,
            "model": self.model.id,
        }
        res = self.post_json(self.get_api_url("training/"), training_payload)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

        self.training = TrainingFactory(model=self.model, user=self.user)

    def test_create_label(self):
        self.label = LabelFactory(aoi=self.aoi)
        self.training = TrainingFactory(model=self.model, user=self.user)

        label_payload = {
            "geom": self.label.geom.json,
            "aoi": self.aoi.id,
        }

        res = self.post_json(self.get_api_url("label/"), label_payload)
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        label_payload2 = {
            "geom": self.label.geom.json,
            "aoi": self.aoi.id,
        }

        res = self.post_json(self.get_api_url("label/"), label_payload2)
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        label_payload3 = {
            "geom": self.label.geom.json,
            "aoi": 40,
        }
        res = self.post_json(self.get_api_url("label/"), label_payload3)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_get_runStatus(self):
        training = TrainingFactory(model=self.model, user=self.user)
        res = self.client.get(
            self.get_api_url(f"task/status/{training.id}/"), headers=self.headers
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_submit_training_feedback(self):
        training = TrainingFactory(model=self.model, user=self.user)
        training_feedback_payload = {
            "training_id": training.id,
            "config": {
                "epochs": 20,
                "batch_size": 8,
                "zoom_level": [19, 20],
            },
            "comments": "This is not a good feedback",
            "action": "REJECT",
        }
        res = self.post_json(self.get_api_url("feedback/"), training_feedback_payload)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_publish_training(self):
        training = TrainingFactory(model=self.model, user=self.user)

        res = self.client.post(
            self.get_api_url(f"training/publish/{training.id}/"), headers=self.headers
        )
        self.assertEqual(res.status_code, 409)

    # def test_get_GpxView(self):
    #     training = TrainingFactory(model=self.model, user=self.user)
    #     feedbackAoi = FeedbackAoiFactory(training=training, user=self.user)

    #     # generate aoi GPX view - aoi_id

    #     res = self.client.get(f"{API_BASE}/aoi/gpx/{self.aoi.id}/", headers=headersList)
    #     self.assertEqual(res.status_code, status.HTTP_200_OK)

    #     # generate feedback aoi GPX view - feedback aoi_id

    #     res = self.client.get(
    #         f"{API_BASE}/feedback-aoi/gpx/{feedbackAoi.id}/", headers=headersList
    #     )
    #     self.assertEqual(res.status_code, status.HTTP_200_OK)

    # def test_get_workspace(self):
    #     # get training workspace

    #     res = self.client.get(f"{API_BASE}/workspace/dataset_1/", headers=headersList)
    #     self.assertEqual(res.status_code, 404)
