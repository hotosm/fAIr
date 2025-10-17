import io
import json
from unittest.mock import MagicMock, patch

from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status

from .base import BaseAPITestCase
from .factories import TrainingFactory, PredictionFactory, UserNotificationFactory


class LabelUploadTest(BaseAPITestCase):

    def test_upload_no_file_provided(self):
        res = self.client.post(
            self.get_api_url(f"/label/upload/{self.aoi.id}/"),
            {},
            headers=self.headers
        )
        
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_upload_requires_authentication(self):
        res = self.client.post(
            self.get_api_url(f"/label/upload/{self.aoi.id}/"),
            {}
        )
        
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)


class OSMFetchTest(BaseAPITestCase):

    def test_fetch_osm_data(self):
        with patch('core.views.async_task') as mock_async:
            res = self.client.post(
                self.get_api_url(f"/label/osm/fetch/{self.aoi.id}/"),
                headers=self.headers
            )
        
        self.assertEqual(res.status_code, status.HTTP_202_ACCEPTED)
        self.assertIn('Processing', res.json())
        mock_async.assert_called_once()

    def test_fetch_osm_data_invalid_aoi(self):
        res = self.client.post(
            self.get_api_url("/label/osm/fetch/999999/"),
            headers=self.headers
        )
        
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_fetch_osm_data_requires_authentication(self):
        res = self.client.post(
            self.get_api_url(f"/label/osm/fetch/{self.aoi.id}/")
        )
        
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)


class TerminateTrainingTest(BaseAPITestCase):

    def test_terminate_running_training(self):
        training = TrainingFactory(
            model=self.model,
            user=self.user,
            task_id='test-task-id-123',
            status='RUNNING'
        )
        
        mock_task = MagicMock()
        mock_task.state = 'STARTED'
        self.mock_celery.return_value = mock_task
        
        with patch('core.views.current_app') as mock_app:
            res = self.client.post(
                self.get_api_url(f"/training/terminate/{training.id}/"),
                headers=self.headers
            )
        
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('cancelled', res.json()['detail'].lower())
        mock_app.control.revoke.assert_called_once_with('test-task-id-123', terminate=True)
        
        training.refresh_from_db()
        self.assertEqual(training.status, 'FAILED')

    def test_terminate_training_no_task_id(self):
        training = TrainingFactory(
            model=self.model,
            user=self.user,
            task_id=None
        )
        
        res = self.client.post(
            self.get_api_url(f"/training/terminate/{training.id}/"),
            headers=self.headers
        )
        
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('No task', res.json()['detail'])

    def test_terminate_training_already_finished(self):
        training = TrainingFactory(
            model=self.model,
            user=self.user,
            task_id='test-task-id',
            status='SUCCESS'
        )
        
        mock_task = MagicMock()
        mock_task.state = 'SUCCESS'
        self.mock_celery.return_value = mock_task
        
        res = self.client.post(
            self.get_api_url(f"/training/terminate/{training.id}/"),
            headers=self.headers
        )
        
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('cannot be cancelled', res.json()['detail'])

    def test_terminate_training_not_owned(self):
        from .factories import OsmUserFactory
        other_user = OsmUserFactory()
        training = TrainingFactory(
            model=self.model,
            user=other_user,
            task_id='test-task-id'
        )
        
        res = self.client.post(
            self.get_api_url(f"/training/terminate/{training.id}/"),
            headers=self.headers
        )
        
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_terminate_training_not_found(self):
        res = self.client.post(
            self.get_api_url("/training/terminate/999999/"),
            headers=self.headers
        )
        
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)


class TerminatePredictionTest(BaseAPITestCase):

    def test_terminate_running_prediction(self):
        prediction = PredictionFactory(
            user=self.user,
            task_id='test-pred-task-id',
            status='RUNNING'
        )
        
        mock_task = MagicMock()
        mock_task.state = 'STARTED'
        self.mock_celery.return_value = mock_task
        
        with patch('core.views.current_app') as mock_app:
            res = self.client.post(
                self.get_api_url(f"/prediction/terminate/{prediction.id}/"),
                headers=self.headers
            )
        
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('cancelled', res.json()['detail'].lower())
        mock_app.control.revoke.assert_called_once_with('test-pred-task-id', terminate=True)
        
        prediction.refresh_from_db()
        self.assertEqual(prediction.status, 'FAILED')

    def test_terminate_prediction_no_task_id(self):
        prediction = PredictionFactory(
            user=self.user,
            task_id=None
        )
        
        res = self.client.post(
            self.get_api_url(f"/prediction/terminate/{prediction.id}/"),
            headers=self.headers
        )
        
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_terminate_prediction_not_owned(self):
        from .factories import OsmUserFactory
        other_user = OsmUserFactory()
        prediction = PredictionFactory(
            user=other_user,
            task_id='test-task-id'
        )
        
        res = self.client.post(
            self.get_api_url(f"/prediction/terminate/{prediction.id}/"),
            headers=self.headers
        )
        
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)


class NotificationManagementTest(BaseAPITestCase):

    def test_mark_notification_as_read(self):
        notification = UserNotificationFactory(
            user=self.user,
            is_read=False
        )
        
        res = self.client.post(
            self.get_api_url(f"/notifications/mark-as-read/{notification.id}/"),
            headers=self.headers
        )
        
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('marked as read', res.json()['detail'])
        
        notification.refresh_from_db()
        self.assertTrue(notification.is_read)
        self.assertIsNotNone(notification.read_at)

    def test_mark_already_read_notification(self):
        notification = UserNotificationFactory(
            user=self.user,
            is_read=True
        )
        
        res = self.client.post(
            self.get_api_url(f"/notifications/mark-as-read/{notification.id}/"),
            headers=self.headers
        )
        
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('already marked', res.json()['detail'])

    def test_mark_notification_not_owned(self):
        from .factories import OsmUserFactory
        other_user = OsmUserFactory()
        notification = UserNotificationFactory(
            user=other_user,
            is_read=False
        )
        
        res = self.client.post(
            self.get_api_url(f"/notifications/mark-as-read/{notification.id}/"),
            headers=self.headers
        )
        
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_mark_all_notifications_as_read(self):
        UserNotificationFactory(user=self.user, is_read=False)
        UserNotificationFactory(user=self.user, is_read=False)
        UserNotificationFactory(user=self.user, is_read=False)
        
        res = self.client.post(
            self.get_api_url("/notifications/mark-all-as-read/"),
            headers=self.headers
        )
        
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('All unread', res.json()['detail'])
        
        from core.models import UserNotification
        unread_count = UserNotification.objects.filter(
            user=self.user,
            is_read=False
        ).count()
        self.assertEqual(unread_count, 0)

    def test_mark_all_when_no_unread_notifications(self):
        res = self.client.post(
            self.get_api_url("/notifications/mark-all-as-read/"),
            headers=self.headers
        )
        
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn('No unread', res.json()['detail'])


class WorkspaceViewTest(BaseAPITestCase):

    def test_workspace_endpoints_exist(self):
        res_workspace = self.client.get(
            self.get_api_url("/workspace/dataset_1/"),
            headers=self.headers
        )
        self.assertIn(res_workspace.status_code, [200, 500])
        
        res_download = self.client.get(
            self.get_api_url("/workspace/download/dataset_1/file.zip"),
            headers=self.headers
        )
        self.assertIn(res_download.status_code, [200, 404, 500])


class UtilityEndpointTest(BaseAPITestCase):

    def test_users_list_view_requires_admin(self):
        res = self.client.get(
            self.get_api_url("/users/"),
            headers=self.headers
        )
        
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_model_centroid_view(self):
        res = self.client.get(
            self.get_api_url("/models/centroid/")
        )
        
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_dataset_centroid_view(self):
        res = self.client.get(
            self.get_api_url("/datasets/centroid/")
        )
        
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_gpx_view(self):
        res = self.client.get(
            self.get_api_url(f"/aoi/gpx/{self.aoi.id}/")
        )
        
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.headers['Content-Type'], 'application/xml')

    def test_conflate_endpoint_exists(self):
        res = self.client.post(
            self.get_api_url("/conflate/"),
            headers=self.headers
        )
        
        self.assertIn(res.status_code, [200, 400, 403, 500])
