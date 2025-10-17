from rest_framework import status
from rest_framework.test import APITestCase

from .base import BaseAPITestCase
from .factories import (
    AoiFactory,
    DatasetFactory,
    FeedbackFactory,
    LabelFactory,
    ModelFactory,
    TrainingFactory,
)
from core.models import Dataset, Model, Training, Banner, UserNotification


class DatasetViewSetTest(BaseAPITestCase):

    def test_list_datasets(self):
        DatasetFactory(user=self.user)
        DatasetFactory(user=self.user)
        
        res = self.client.get(self.get_api_url("/dataset/"), headers=self.headers)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertGreater(len(res.json()["results"]), 0)

    def test_retrieve_dataset(self):
        res = self.client.get(
            self.get_api_url(f"/dataset/{self.dataset.id}/"),
            headers=self.headers
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.json()["id"], self.dataset.id)

    def test_create_dataset(self):
        payload = {
            "name": "New Dataset",
            "source_imagery": "https://tiles.example.com/{z}/{x}/{y}",
        }
        res = self.client.post(
            self.get_api_url("/dataset/"),
            payload,
            headers=self.headers
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Dataset.objects.filter(name="New Dataset").exists())

    def test_update_dataset(self):
        payload = {"name": "Updated Dataset"}
        res = self.post_json(
            self.get_api_url(f"/dataset/{self.dataset.id}/"),
            payload,
            method="PATCH"
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.dataset.refresh_from_db()
        self.assertEqual(self.dataset.name, "Updated Dataset")

    def test_delete_dataset(self):
        dataset = DatasetFactory(user=self.user)
        res = self.client.delete(
            self.get_api_url(f"/dataset/{dataset.id}/"),
            headers=self.headers
        )
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Dataset.objects.filter(id=dataset.id).exists())

    def test_filter_dataset_by_status(self):
        res = self.client.get(
            self.get_api_url("/dataset/?status=0"),
            headers=self.headers
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_search_dataset_by_name(self):
        DatasetFactory(user=self.user, name="Searchable Dataset")
        res = self.client.get(
            self.get_api_url("/dataset/?search=Searchable"),
            headers=self.headers
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)


class ModelViewSetTest(BaseAPITestCase):

    def test_list_models(self):
        ModelFactory(dataset=self.dataset, user=self.user)
        res = self.client.get(self.get_api_url("/model/"), headers=self.headers)
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_retrieve_model(self):
        res = self.client.get(
            self.get_api_url(f"/model/{self.model.id}/"),
            headers=self.headers
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.json()["id"], self.model.id)

    def test_create_model(self):
        payload = {
            "name": "New Model",
            "dataset": self.dataset.id,
        }
        res = self.client.post(
            self.get_api_url("/model/"),
            payload,
            headers=self.headers
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

    def test_update_model(self):
        payload = {"name": "Updated Model"}
        res = self.post_json(
            self.get_api_url(f"/model/{self.model.id}/"),
            payload,
            method="PATCH"
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_delete_model(self):
        model = ModelFactory(dataset=self.dataset, user=self.user)
        res = self.client.delete(
            self.get_api_url(f"/model/{model.id}/"),
            headers=self.headers
        )
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)

    def test_filter_model_by_dataset(self):
        res = self.client.get(
            self.get_api_url(f"/model/?dataset={self.dataset.id}"),
            headers=self.headers
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_filter_model_by_status(self):
        res = self.client.get(
            self.get_api_url("/model/?status=-1"),
            headers=self.headers
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_search_model_by_name(self):
        res = self.client.get(
            self.get_api_url("/model/?search=Test"),
            headers=self.headers
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_order_models_by_created_at(self):
        res = self.client.get(
            self.get_api_url("/model/?ordering=-created_at"),
            headers=self.headers
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)


class TrainingViewSetTest(BaseAPITestCase):

    def test_list_trainings(self):
        TrainingFactory(model=self.model, user=self.user)
        res = self.client.get(self.get_api_url("/training/"), headers=self.headers)
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_retrieve_training(self):
        training = TrainingFactory(model=self.model, user=self.user)
        res = self.client.get(
            self.get_api_url(f"/training/{training.id}/"),
            headers=self.headers
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.json()["id"], training.id)

    def test_update_training_not_supported(self):
        training = TrainingFactory(model=self.model, user=self.user)
        payload = {"description": "Updated description"}
        res = self.post_json(
            self.get_api_url(f"/training/{training.id}/"),
            payload,
            method="PATCH"
        )
        self.assertEqual(res.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_delete_training(self):
        training = TrainingFactory(model=self.model, user=self.user)
        res = self.client.delete(
            self.get_api_url(f"/training/{training.id}/"),
            headers=self.headers
        )
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)

    def test_filter_training_by_model(self):
        res = self.client.get(
            self.get_api_url(f"/training/?model={self.model.id}"),
            headers=self.headers
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_filter_training_by_status(self):
        res = self.client.get(
            self.get_api_url("/training/?status=SUBMITTED"),
            headers=self.headers
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)


class AOIViewSetTest(BaseAPITestCase):

    def test_list_aois(self):
        AoiFactory(dataset=self.dataset, user=self.user)
        res = self.client.get(self.get_api_url("/aoi/"), headers=self.headers)
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_retrieve_aoi(self):
        res = self.client.get(
            self.get_api_url(f"/aoi/{self.aoi.id}/"),
            headers=self.headers
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_update_aoi(self):
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
        payload = {"geom": geojson}
        res = self.post_json(
            self.get_api_url(f"/aoi/{self.aoi.id}/"),
            payload,
            method="PATCH"
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_delete_aoi(self):
        aoi = AoiFactory(dataset=self.dataset, user=self.user)
        res = self.client.delete(
            self.get_api_url(f"/aoi/{aoi.id}/"),
            headers=self.headers
        )
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)


class LabelViewSetTest(BaseAPITestCase):

    def test_list_labels(self):
        LabelFactory(aoi=self.aoi)
        res = self.client.get(self.get_api_url("/label/"), headers=self.headers)
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_retrieve_label(self):
        label = LabelFactory(aoi=self.aoi)
        res = self.client.get(
            self.get_api_url(f"/label/{label.id}/"),
            headers=self.headers
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_delete_label_requires_staff(self):
        label = LabelFactory(aoi=self.aoi)
        res = self.client.delete(
            self.get_api_url(f"/label/{label.id}/"),
            headers=self.headers
        )
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)


class FeedbackViewSetTest(BaseAPITestCase):

    def test_list_feedbacks(self):
        training = TrainingFactory(model=self.model, user=self.user)
        FeedbackFactory(training=training, user=self.user)
        res = self.client.get(self.get_api_url("/feedback/"), headers=self.headers)
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_retrieve_feedback(self):
        feedback = FeedbackFactory(training__model=self.model, user=self.user)
        res = self.client.get(
            self.get_api_url(f"/feedback/{feedback.id}/"),
            headers=self.headers
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_update_feedback(self):
        feedback = FeedbackFactory(training__model=self.model, user=self.user)
        payload = {"comments": "Updated comment"}
        res = self.post_json(
            self.get_api_url(f"/feedback/{feedback.id}/"),
            payload,
            method="PATCH"
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_delete_feedback(self):
        feedback = FeedbackFactory(training__model=self.model, user=self.user)
        res = self.client.delete(
            self.get_api_url(f"/feedback/{feedback.id}/"),
            headers=self.headers
        )
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)


class BannerViewSetTest(APITestCase):

    def test_list_banners(self):
        from core.models import Banner
        Banner.objects.create(message="Test banner")
        res = self.client.get("/api/v1/banner/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_retrieve_banner(self):
        from core.models import Banner
        banner = Banner.objects.create(message="Test banner")
        res = self.client.get(f"/api/v1/banner/{banner.id}/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.json()["message"], "Test banner")

    def test_create_banner_requires_admin(self):
        payload = {"message": "New banner"}
        res = self.client.post("/api/v1/banner/", payload)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_update_banner_requires_admin(self):
        from core.models import Banner
        banner = Banner.objects.create(message="Test banner")
        payload = {"message": "Updated banner"}
        res = self.client.patch(f"/api/v1/banner/{banner.id}/", payload)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_delete_banner_requires_admin(self):
        from core.models import Banner
        banner = Banner.objects.create(message="Test banner")
        res = self.client.delete(f"/api/v1/banner/{banner.id}/")
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)


class NotificationViewSetTest(BaseAPITestCase):

    def test_list_notifications(self):
        res = self.client.get(
            self.get_api_url("/notifications/me/"),
            headers=self.headers
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_retrieve_notification(self):
        notification = UserNotification.objects.create(
            user=self.user,
            message="Test notification"
        )
        res = self.client.get(
            self.get_api_url(f"/notifications/me/{notification.id}/"),
            headers=self.headers
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_filter_unread_notifications(self):
        res = self.client.get(
            self.get_api_url("/notifications/me/?is_read=false"),
            headers=self.headers
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
