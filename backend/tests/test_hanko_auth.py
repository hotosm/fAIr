from unittest.mock import MagicMock, patch
from django.test import TestCase, override_settings
from rest_framework import status
from login.hanko_helpers import (
    generate_synthetic_osm_id,
    is_real_osm_user,
    find_legacy_user_by_osm_id,
    create_osm_user,
)
from .base import SimpleAPITestCase
from .factories import OsmUserFactory


class TestSyntheticOsmId(TestCase):
    """Tests for synthetic osm_id generation."""

    def test_generates_negative_id(self):
        osm_id = generate_synthetic_osm_id("hanko-user-123")
        self.assertLess(osm_id, 0)

    def test_same_input_same_output(self):
        id1 = generate_synthetic_osm_id("hanko-user-abc")
        id2 = generate_synthetic_osm_id("hanko-user-abc")
        self.assertEqual(id1, id2)

    def test_different_input_different_output(self):
        id1 = generate_synthetic_osm_id("user-a")
        id2 = generate_synthetic_osm_id("user-b")
        self.assertNotEqual(id1, id2)

    def test_limited_to_9_digits(self):
        osm_id = generate_synthetic_osm_id("any-hanko-id")
        self.assertGreater(osm_id, -10**9)


class TestIsRealOsmUser(TestCase):
    """Tests for real vs synthetic user detection."""

    def test_positive_is_real(self):
        self.assertTrue(is_real_osm_user(12345))

    def test_negative_is_synthetic(self):
        self.assertFalse(is_real_osm_user(-12345))

    def test_zero_is_not_real(self):
        self.assertFalse(is_real_osm_user(0))


class TestFindLegacyUser(TestCase):
    """Tests for legacy user lookup."""

    def test_finds_existing_user(self):
        user = OsmUserFactory(osm_id=999)
        found = find_legacy_user_by_osm_id(999)
        self.assertEqual(found, user)

    def test_returns_none_for_missing(self):
        found = find_legacy_user_by_osm_id(99999)
        self.assertIsNone(found)


class TestCreateOsmUser(TestCase):
    """Tests for OsmUser creation."""

    def test_creates_new_user(self):
        user = create_osm_user(
            osm_id=-123,
            username="newuser",
            email="new@example.com"
        )
        self.assertEqual(user.osm_id, -123)
        self.assertEqual(user.username, "newuser")

    def test_returns_existing_user(self):
        existing = OsmUserFactory(osm_id=456)
        user = create_osm_user(osm_id=456, username="different")
        self.assertEqual(user.id, existing.id)

    def test_handles_username_conflict(self):
        OsmUserFactory(osm_id=100, username="taken")
        user = create_osm_user(osm_id=-200, username="taken")
        self.assertEqual(user.username, "taken_1")


class TestAuthStatusEndpoint(SimpleAPITestCase):
    """Tests for /api/v1/auth/status/ endpoint."""

    def setUp(self):
        super().setUp()
        self.api_base = "/api/v1"

    @override_settings(AUTH_PROVIDER='hanko')
    def test_hanko_not_authenticated(self):
        res = self.client.get(self.get_api_url("/auth/status/"))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertFalse(res.data['authenticated'])


class TestHankoAuthentication(TestCase):
    """Tests for HankoAuthentication class."""

    def test_no_hotosm_attribute(self):
        from login.authentication import HankoAuthentication

        auth = HankoAuthentication()
        request = MagicMock(spec=[])  # Empty spec = no attributes

        result = auth.authenticate(request)
        self.assertEqual(result, (None, None))

    def test_no_hanko_user(self):
        from login.authentication import HankoAuthentication

        auth = HankoAuthentication()
        request = MagicMock()
        request.hotosm = MagicMock()
        request.hotosm.user = None

        result = auth.authenticate(request)
        self.assertEqual(result, (None, None))

    @patch('hotosm_auth_django.get_mapped_user_id')
    def test_mapped_user_found(self, mock_get_mapped):
        from login.authentication import HankoAuthentication

        user = OsmUserFactory(osm_id=789)
        mock_get_mapped.return_value = "789"

        auth = HankoAuthentication()
        request = MagicMock()
        request.hotosm = MagicMock()
        request.hotosm.user = MagicMock()
        request.hotosm.user.email = "test@example.com"

        result = auth.authenticate(request)
        self.assertEqual(result[0], user)

    @patch('hotosm_auth_django.get_mapped_user_id')
    def test_no_mapping_needs_onboarding(self, mock_get_mapped):
        from login.authentication import HankoAuthentication

        mock_get_mapped.return_value = None

        auth = HankoAuthentication()
        request = MagicMock()
        request.hotosm = MagicMock()
        request.hotosm.user = MagicMock()
        request.hotosm.user.email = "new@example.com"

        result = auth.authenticate(request)
        self.assertEqual(result, (None, None))
        self.assertTrue(request.needs_onboarding)
