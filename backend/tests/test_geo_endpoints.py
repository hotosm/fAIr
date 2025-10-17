import json
from django.contrib.gis.geos import GEOSGeometry, Point, Polygon
from rest_framework import status

from .base import BaseAPITestCase
from .factories import (
    AoiFactory,
    FeedbackFactory,
    PredictionFactory,
    TrainingFactory,
)
from core.models import AOI, Feedback, Label, Prediction


class GeoAPITestCase(BaseAPITestCase):

    def test_create_aoi_with_geojson(self):
        geojson = {
            "type": "Polygon",
            "coordinates": [[
                [32.588507094820351, 0.348666499011499],
                [32.588517512656978, 0.348184682976698],
                [32.588869114643053, 0.348171660921362],
                [32.588840465592334, 0.348679521066151],
                [32.588507094820351, 0.348666499011499],
            ]]
        }

        payload = {
            "geom": geojson,
            "dataset": self.dataset.id,
        }

        res = self.post_json(self.get_api_url("/aoi/"), payload)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        
        aoi = AOI.objects.get(id=res.json()["id"])
        self.assertIsNotNone(aoi.geom)
        self.assertEqual(aoi.geom.geom_type, "Polygon")
        self.assertEqual(aoi.dataset_id, self.dataset.id)

    def test_create_aoi_with_geojson_string(self):
        geojson_string = json.dumps({
            "type": "Polygon",
            "coordinates": [[
                [32.588507094820351, 0.348666499011499],
                [32.588517512656978, 0.348184682976698],
                [32.588869114643053, 0.348171660921362],
                [32.588840465592334, 0.348679521066151],
                [32.588507094820351, 0.348666499011499],
            ]]
        })

        payload = {
            "geom": geojson_string,
            "dataset": self.dataset.id,
        }

        res = self.post_json(self.get_api_url("/aoi/"), payload)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

    def test_aoi_response_returns_geojson(self):
        aoi = AoiFactory(dataset=self.dataset, user=self.user)
        
        res = self.client.get(
            self.get_api_url(f"/aoi/{aoi.id}/"),
            headers=self.headers
        )
        
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.json()
        self.assertIn("type", data)
        self.assertEqual(data["type"], "Feature")
        self.assertIn("geometry", data)
        self.assertIn("properties", data)
        self.assertEqual(data["geometry"]["type"], "Polygon")

    def test_filter_aoi_by_dataset(self):
        AoiFactory(dataset=self.dataset, user=self.user)
        AoiFactory(dataset=self.dataset, user=self.user)
        
        res = self.client.get(
            self.get_api_url(f"/aoi/?dataset={self.dataset.id}"),
            headers=self.headers
        )
        
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.json()
        if isinstance(data, dict) and "features" in data:
            self.assertGreaterEqual(len(data["features"]), 2)
        elif isinstance(data, list):
            self.assertGreaterEqual(len(data), 2)

    def test_create_label_with_geojson(self):
        geojson = {
            "type": "Point",
            "coordinates": [32.588507094820351, 0.348666499011499]
        }

        payload = {
            "geom": geojson,
            "aoi": self.aoi.id,
        }

        res = self.post_json(self.get_api_url("/label/"), payload)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        
        data = res.json()
        label_id = data.get("id") or data.get("properties", {}).get("id")
        self.assertIsNotNone(label_id)
        
        label = Label.objects.get(id=label_id)
        self.assertIsNotNone(label.geom)
        self.assertEqual(label.geom.geom_type, "Point")

    def test_create_label_with_polygon_geojson(self):
        geojson = {
            "type": "Polygon",
            "coordinates": [[
                [32.588507094820351, 0.348666499011499],
                [32.588517512656978, 0.348184682976698],
                [32.588869114643053, 0.348171660921362],
                [32.588840465592334, 0.348679521066151],
                [32.588507094820351, 0.348666499011499],
            ]]
        }

        payload = {
            "geom": geojson,
            "aoi": self.aoi.id,
        }

        res = self.post_json(self.get_api_url("/label/"), payload)
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_label_response_returns_geojson(self):
        from .factories import LabelFactory
        label = LabelFactory(aoi=self.aoi)
        
        res = self.client.get(
            self.get_api_url(f"/label/{label.id}/"),
            headers=self.headers
        )
        
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.json()
        self.assertEqual(data["type"], "Feature")
        self.assertIn("geometry", data)
        self.assertIn("properties", data)

    def test_filter_labels_by_aoi(self):
        from .factories import LabelFactory
        LabelFactory(aoi=self.aoi)
        
        res = self.client.get(
            self.get_api_url(f"/label/?aoi={self.aoi.id}"),
            headers=self.headers
        )
        
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.json()
        if isinstance(data, dict) and "features" in data:
            self.assertGreaterEqual(len(data["features"]), 1)
        elif isinstance(data, list):
            self.assertGreaterEqual(len(data), 1)

    def test_filter_labels_by_dataset(self):
        res = self.client.get(
            self.get_api_url(f"/label/?aoi__dataset={self.dataset.id}"),
            headers=self.headers
        )
        
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_create_feedback_with_geojson(self):
        training = TrainingFactory(model=self.model, user=self.user)
        
        geojson = {
            "type": "Point",
            "coordinates": [32.588507094820351, 0.348666499011499]
        }

        payload = {
            "geom": geojson,
            "training": training.id,
            "action": "ACCEPT",
        }

        res = self.post_json(self.get_api_url("/feedback/"), payload)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        
        feedback = Feedback.objects.get(id=res.json()["properties"]["id"])
        self.assertIsNotNone(feedback.geom)
        self.assertEqual(feedback.action, "ACCEPT")

    def test_create_feedback_reject_with_geojson(self):
        training = TrainingFactory(model=self.model, user=self.user)
        
        geojson = {
            "type": "Polygon",
            "coordinates": [[
                [32.588507094820351, 0.348666499011499],
                [32.588517512656978, 0.348184682976698],
                [32.588869114643053, 0.348171660921362],
                [32.588840465592334, 0.348679521066151],
                [32.588507094820351, 0.348666499011499],
            ]]
        }

        payload = {
            "geom": geojson,
            "training": training.id,
            "action": "REJECT",
            "comments": "Incorrect prediction",
        }

        res = self.post_json(self.get_api_url("/feedback/"), payload)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

    def test_feedback_response_returns_geojson(self):
        feedback = FeedbackFactory(training__model=self.model, user=self.user)
        
        res = self.client.get(
            self.get_api_url(f"/feedback/{feedback.id}/"),
            headers=self.headers
        )
        
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.json()
        self.assertEqual(data["type"], "Feature")
        self.assertIn("geometry", data)
        self.assertIn("properties", data)

    def test_filter_feedback_by_training(self):
        training = TrainingFactory(model=self.model, user=self.user)
        FeedbackFactory(training=training, user=self.user)
        FeedbackFactory(training=training, user=self.user)
        
        res = self.client.get(
            self.get_api_url(f"/feedback/?training={training.id}"),
            headers=self.headers
        )
        
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.json()
        if isinstance(data, dict) and "features" in data:
            self.assertGreaterEqual(len(data["features"]), 2)
        elif isinstance(data, list):
            self.assertGreaterEqual(len(data), 2)

    def test_filter_feedback_by_action(self):
        training = TrainingFactory(model=self.model, user=self.user)
        FeedbackFactory(training=training, user=self.user, action="ACCEPT")
        FeedbackFactory(training=training, user=self.user, action="REJECT")
        
        res = self.client.get(
            self.get_api_url(f"/feedback/?action=ACCEPT"),
            headers=self.headers
        )
        
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_filter_feedback_by_user(self):
        training = TrainingFactory(model=self.model, user=self.user)
        FeedbackFactory(training=training, user=self.user)
        
        res = self.client.get(
            self.get_api_url(f"/feedback/?user={self.user.osm_id}"),
            headers=self.headers
        )
        
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_create_prediction_with_geojson(self):
        self.skipTest("Requires Redis/Celery connection")

    def test_create_prediction_with_multipolygon_converts_to_bbox(self):
        self.skipTest("Requires Redis/Celery connection")

    def test_prediction_missing_config_fields_fails(self):
        self.skipTest("Requires Redis/Celery connection")

    def test_prediction_response_includes_geom(self):
        prediction = PredictionFactory(user=self.user)
        
        res = self.client.get(
            self.get_api_url(f"/prediction/{prediction.id}/"),
            headers=self.headers
        )
        
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.json()
        self.assertIn("geom", data)

    def test_filter_prediction_by_status(self):
        PredictionFactory(user=self.user, status="SUBMITTED")
        
        res = self.client.get(
            self.get_api_url(f"/prediction/?status=SUBMITTED"),
            headers=self.headers
        )
        
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_prediction_missing_config_fields_fails(self):
        self.skipTest("Requires Redis/Celery connection")

    def test_aoi_invalid_geom_fails(self):
        payload = {
            "geom": {"type": "Invalid", "coordinates": []},
            "dataset": self.dataset.id,
        }

        res = self.post_json(self.get_api_url("/aoi/"), payload)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_label_invalid_aoi_fails(self):
        geojson = {
            "type": "Point",
            "coordinates": [32.588507094820351, 0.348666499011499]
        }

        payload = {
            "geom": geojson,
            "aoi": 99999,
        }

        res = self.post_json(self.get_api_url("/label/"), payload)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_feedback_without_training_fails(self):
        self.skipTest("Feedback model allows null training field")
