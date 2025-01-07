import json
import os
import shutil

import validators
from django.conf import settings
from rest_framework import status
from rest_framework.test import APILiveServerTestCase, RequestsClient

from .factories import (
    AoiFactory,
    DatasetFactory,
    FeedbackAoiFactory,
    LabelFactory,
    ModelFactory,
    OsmUserFactory,
    TrainingFactory,
)

API_BASE = "http://testserver/api/v1"

# Set the custom headers
headersList = {
    "accept": "application/json",
    "access-token": os.environ.get("TESTING_TOKEN"),
}


class TaskApiTest(APILiveServerTestCase):
    def setUp(self):
        # Create a request factory instance
        self.client = RequestsClient()
        self.user = OsmUserFactory(osm_id=123)
        self.dataset = DatasetFactory(user=self.user)
        self.aoi = AoiFactory(dataset=self.dataset, user=self.user)
        self.model = ModelFactory(dataset=self.dataset, user=self.user)
        self.json_type_header = headersList.copy()
        self.json_type_header["content-type"] = "application/json"

    def test_auth_me(self):
        res = self.client.get(f"{API_BASE}/auth/me/", headers=headersList)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

    def test_auth_login(self):
        res = self.client.get(f"{API_BASE}/auth/login/")
        res_body = res.json()
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(validators.url(res_body["login_url"]), True)

    def test_create_dataset(self):
        # create dataset

        payload = {
            "name": self.dataset.name,
            "source_imagery": self.dataset.source_imagery,
        }
        # test without authentication should be forbidden
        res = self.client.post(f"{API_BASE}/dataset/", payload)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        # test with authentication should be passed
        res = self.client.post(f"{API_BASE}/dataset/", payload, headers=headersList)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

    def test_create_training(self):
        # now dataset is created, create first aoi inside it

        payload_second = {"geom": self.aoi.geom.json, "dataset": self.dataset.id}

        res = self.client.post(
            f"{API_BASE}/aoi/",
            json.dumps(payload_second),
            headers=self.json_type_header,
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

        # create second aoi too, to test multiple aois

        payload_third = {
            "geom": self.aoi.geom.json,
            "dataset": self.dataset.id,
        }
        res = self.client.post(
            f"{API_BASE}/aoi/", json.dumps(payload_third), headers=self.json_type_header
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

        # create model

        model_payload = {"name": self.model.name, "dataset": self.dataset.id}
        res = self.client.post(
            f"{API_BASE}/model/",
            json.dumps(model_payload),
            headers=self.json_type_header,
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

        # create training without label

        training_payload = {
            "description": "My very first training",
            "epochs": 1,
            "zoom_level": [20, 21],
            "batch_size": 1,
            "model": self.model.id,
        }
        res = self.client.post(
            f"{API_BASE}/training/",
            json.dumps(training_payload),
            headers=self.json_type_header,
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

        # download labels from osm for 1

        res = self.client.post(
            f"{API_BASE}/label/osm/fetch/{self.aoi.id}/", "", headers=headersList
        )
        self.assertEqual(res.status_code, 201)

        # download labels from osm for 2

        res = self.client.post(
            f"{API_BASE}/label/osm/fetch/{self.aoi.id}/", "", headers=headersList
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

        # create training with epochs greater than the limit

        training_payload = {
            "description": "My very first training",
            "epochs": 31,
            "zoom_level": [20, 21],
            "batch_size": 1,
            "model": self.model.id,
        }
        res = self.client.post(
            f"{API_BASE}/training/",
            json.dumps(training_payload),
            headers=self.json_type_header,
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

        # create training with batch size greater than the limit

        training_payload = {
            "description": "My very first training",
            "epochs": 1,
            "zoom_level": [20, 21],
            "batch_size": 9,
            "model": self.model.id,
        }
        res = self.client.post(
            f"{API_BASE}/training/",
            json.dumps(training_payload),
            headers=self.json_type_header,
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

        # create training inside model

        training_payload = {
            "description": "My very first training",
            "epochs": 1,
            "zoom_level": [20, 21],
            "batch_size": 1,
            "model": self.model.id,
        }
        res = self.client.post(
            f"{API_BASE}/training/",
            json.dumps(training_payload),
            headers=self.json_type_header,
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

        # create another training for the same model

        training_payload = {
            "description": "My very first training",
            "epochs": 1,
            "zoom_level": [20, 21],
            "batch_size": 1,
            "model": self.model.id,
        }
        res = self.client.post(
            f"{API_BASE}/training/",
            json.dumps(training_payload),
            headers=self.json_type_header,
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

        self.training = TrainingFactory(model=self.model, user=self.user)

    def test_create_label(self):
        self.label = LabelFactory(aoi=self.aoi)
        self.training = TrainingFactory(model=self.model, user=self.user)

        # create label

        label_payload = {
            "geom": self.label.geom.json,
            "aoi": self.aoi.id,
        }

        res = self.client.post(
            f"{API_BASE}/label/",
            json.dumps(label_payload),
            headers=self.json_type_header,
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)  # 201- for create

        # create another label with the same geom and aoi

        label_payload2 = {
            "geom": self.label.geom.json,
            "aoi": self.aoi.id,
        }

        res = self.client.post(
            f"{API_BASE}/label/",
            json.dumps(label_payload2),
            headers=self.json_type_header,
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)  # 200- for update

        # create another label with error

        label_payload3 = {
            "geom": self.label.geom.json,
            "aoi": 40,  # non-existent aoi
        }
        res = self.client.post(
            f"{API_BASE}/label/",
            json.dumps(label_payload3),
            headers=self.json_type_header,
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_fetch_feedbackAoi_osm_label(self):
        # create feedback aoi
        training = TrainingFactory(model=self.model, user=self.user)
        feedbackAoi = FeedbackAoiFactory(training=training, user=self.user)

        # download available osm data as labels for the feedback aoi

        res = self.client.post(
            f"{API_BASE}/label/feedback/osm/fetch/{feedbackAoi.id}/",
            "",
            headers=headersList,
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

    def test_get_runStatus(self):
        training = TrainingFactory(model=self.model, user=self.user)

        # get running training status

        res = self.client.get(
            f"{API_BASE}/training/status/{training.id}/", headers=headersList
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_submit_training_feedback(self):
        training = TrainingFactory(model=self.model, user=self.user)

        # apply feedback to training published checkpoints

        training_feedback_payload = {
            "training_id": training.id,
            "epochs": 20,
            "batch_size": 8,
            "zoom_level": [19, 20],
        }
        res = self.client.post(
            f"{API_BASE}/feedback/training/submit/",
            json.dumps(training_feedback_payload),
            headers=self.json_type_header,
        )
        # submit unfinished/unpublished training feedback should not pass
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_publish_training(self):
        training = TrainingFactory(model=self.model, user=self.user)

        # publish an unfinished training should not pass

        res = self.client.post(
            f"{API_BASE}/training/publish/{training.id}/", headers=headersList
        )
        self.assertEqual(res.status_code, 409)

    def test_get_GpxView(self):
        training = TrainingFactory(model=self.model, user=self.user)
        feedbackAoi = FeedbackAoiFactory(training=training, user=self.user)

        # generate aoi GPX view - aoi_id

        res = self.client.get(f"{API_BASE}/aoi/gpx/{self.aoi.id}/", headers=headersList)
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        # generate feedback aoi GPX view - feedback aoi_id

        res = self.client.get(
            f"{API_BASE}/feedback-aoi/gpx/{feedbackAoi.id}/", headers=headersList
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_get_workspace(self):
        # get training workspace

        res = self.client.get(f"{API_BASE}/workspace/dataset_1/", headers=headersList)
        self.assertEqual(res.status_code, 404)
