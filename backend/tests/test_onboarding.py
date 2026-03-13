from unittest.mock import MagicMock, patch
from django.test import TestCase, override_settings
from rest_framework import status
from .base import SimpleAPITestCase
from .factories import OsmUserFactory


class TestOnboardingCallback(TestCase):
    """Tests for OnboardingCallback view."""

    @override_settings(AUTH_PROVIDER='legacy')
    def test_rejects_when_not_hanko_auth(self):
        from login.views import OnboardingCallback

        view = OnboardingCallback()
        request = MagicMock()

        response = view.get(request)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Hanko', response.data['error'])

    @override_settings(AUTH_PROVIDER='hanko')
    def test_rejects_unauthenticated(self):
        from login.views import OnboardingCallback

        view = OnboardingCallback()
        request = MagicMock(spec=[])

        response = view.get(request)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    @override_settings(AUTH_PROVIDER='hanko')
    def test_rejects_no_hanko_user(self):
        from login.views import OnboardingCallback

        view = OnboardingCallback()
        request = MagicMock()
        request.hotosm = MagicMock()
        request.hotosm.user = None

        response = view.get(request)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    @override_settings(AUTH_PROVIDER='hanko', FRONTEND_URL='https://fair.hotosm.org')
    @patch('hotosm_auth_django.create_user_mapping')
    def test_new_user_creates_synthetic_account(self, mock_create_mapping):
        from login.views import OnboardingCallback
        from login.models import OsmUser

        view = OnboardingCallback()
        request = MagicMock()
        request.hotosm = MagicMock()
        request.hotosm.user = MagicMock()
        request.hotosm.user.id = "hanko-new-user-123"
        request.hotosm.user.email = "newuser@example.com"
        request.query_params = {'new_user': 'true'}

        response = view.get(request)

        self.assertEqual(response.status_code, 302)
        self.assertEqual(response.url, 'https://fair.hotosm.org')

        user = OsmUser.objects.get(username='newuser')
        self.assertLess(user.osm_id, 0)

        mock_create_mapping.assert_called_once()
        call_args = mock_create_mapping.call_args
        self.assertEqual(call_args.kwargs['hanko_user_id'], "hanko-new-user-123")
        self.assertEqual(call_args.kwargs['app_name'], "fair")

    @override_settings(AUTH_PROVIDER='hanko')
    def test_legacy_user_requires_osm_connection(self):
        from login.views import OnboardingCallback

        view = OnboardingCallback()
        request = MagicMock()
        request.hotosm = MagicMock()
        request.hotosm.user = MagicMock()
        request.hotosm.user.id = "hanko-legacy-123"
        request.hotosm.osm = None
        request.query_params = {'new_user': 'false'}

        response = view.get(request)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('OSM connection', response.data['error'])

    @override_settings(AUTH_PROVIDER='hanko', FRONTEND_URL='https://fair.hotosm.org')
    @patch('hotosm_auth_django.create_user_mapping')
    def test_legacy_user_links_existing_account(self, mock_create_mapping):
        from login.views import OnboardingCallback

        legacy_user = OsmUserFactory(osm_id=555, username='legacymapper')

        view = OnboardingCallback()
        request = MagicMock()
        request.hotosm = MagicMock()
        request.hotosm.user = MagicMock()
        request.hotosm.user.id = "hanko-legacy-456"
        request.hotosm.user.email = "legacy@example.com"
        request.hotosm.osm = MagicMock()
        request.hotosm.osm.osm_user_id = 555
        request.hotosm.osm.osm_username = 'legacymapper'
        request.query_params = {'new_user': 'false'}

        response = view.get(request)

        self.assertEqual(response.status_code, 302)

        mock_create_mapping.assert_called_once()
        call_args = mock_create_mapping.call_args
        self.assertEqual(call_args.kwargs['app_user_id'], "555")

    @override_settings(AUTH_PROVIDER='hanko', LOGIN_URL='https://login.hotosm.org', FRONTEND_URL='/')
    def test_legacy_user_not_found_redirects_with_error(self):
        from login.views import OnboardingCallback

        view = OnboardingCallback()
        request = MagicMock()
        request.hotosm = MagicMock()
        request.hotosm.user = MagicMock()
        request.hotosm.user.id = "hanko-unknown-789"
        request.hotosm.osm = MagicMock()
        request.hotosm.osm.osm_user_id = 99999
        request.hotosm.osm.osm_username = 'unknownuser'
        request.query_params = {'new_user': 'false'}

        response = view.get(request)

        self.assertEqual(response.status_code, 302)
        self.assertIn('login.hotosm.org', response.url)
        self.assertIn('error=', response.url)


class TestAuthStatusHanko(SimpleAPITestCase):
    """Tests for AuthStatus view with Hanko auth."""

    def setUp(self):
        super().setUp()
        self.api_base = "/api/v1"

    @override_settings(AUTH_PROVIDER='hanko')
    def test_no_hotosm_returns_unauthenticated(self):
        res = self.client.get(self.get_api_url("/auth/status/"))

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['auth_provider'], 'hanko')
        self.assertFalse(res.data['authenticated'])
        self.assertFalse(res.data['hanko_authenticated'])

    @override_settings(AUTH_PROVIDER='legacy')
    def test_legacy_provider_returns_legacy_status(self):
        # Force login with a test user to ensure request.user is set
        from login.models import OsmUser
        user = OsmUser.objects.create(osm_id=1, username='testuser')
        self.client.force_authenticate(user=user)

        res = self.client.get(self.get_api_url("/auth/status/"))

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['auth_provider'], 'legacy')
