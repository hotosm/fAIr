import logging
import secrets

from django.conf import settings
from rest_framework import authentication, exceptions

from config.settings import AuthProvider

from .models import OsmUser

logger = logging.getLogger(__name__)


class HankoAuthentication(authentication.BaseAuthentication):
    """Hanko SSO authentication using user mappings."""

    def authenticate(self, request):
        from hotosm_auth_django import get_mapped_user_id

        if not hasattr(request, "hotosm"):
            raise exceptions.AuthenticationFailed("HankoAuthMiddleware not configured")

        hanko_user = request.hotosm.user

        if not hanko_user:
            logger.debug("No Hanko user in request")
            return (None, None)

        mapped_osm_id = get_mapped_user_id(hanko_user, app_name="fair")

        if mapped_osm_id is not None:
            try:
                osm_id = int(mapped_osm_id)
                user = OsmUser.objects.get(osm_id=osm_id)
                logger.debug(
                    f"Authenticated via mapping: Hanko={hanko_user.email}, osm_id={osm_id}"
                )
                return (user, None)
            except (OsmUser.DoesNotExist, ValueError) as e:
                logger.warning(
                    f"Mapping exists but user not found: osm_id={mapped_osm_id}, error={e}"
                )
                # Fall through to onboarding.

        request.needs_onboarding = True
        request.hanko_user_for_onboarding = hanko_user
        logger.debug(f"Hanko user {hanko_user.email} needs onboarding (no mapping)")
        return (None, None)


_DEV_USER_OSM_ID = 1
_DEV_USER_USERNAME = "dev-user"
_DEV_USER_CACHE: OsmUser | None = None


class DevAuthentication(authentication.BaseAuthentication):
    """Local-development authentication via a static `FAIR_DEV_TOKEN`.

    Active only when AUTH_PROVIDER=dev. Rejects every request whose `access-token`
    header does not match the configured token in constant time. On match, returns
    a single seeded `OsmUser(osm_id=1, username='dev-user')` (created on first hit).

    Never enable in prod: anyone with the token has full dev-user access.
    """

    def authenticate(self, request):
        global _DEV_USER_CACHE
        configured = getattr(settings, "FAIR_DEV_TOKEN", "") or ""
        if not configured:
            raise exceptions.AuthenticationFailed(
                "AUTH_PROVIDER=dev requires FAIR_DEV_TOKEN to be set"
            )

        provided = request.headers.get("access-token") or ""
        if not provided:
            return None

        if not secrets.compare_digest(provided, configured):
            raise exceptions.AuthenticationFailed("Invalid FAIR_DEV_TOKEN")

        if _DEV_USER_CACHE is None:
            _DEV_USER_CACHE, _ = OsmUser.objects.get_or_create(
                osm_id=_DEV_USER_OSM_ID,
                defaults={"username": _DEV_USER_USERNAME},
            )
        return (_DEV_USER_CACHE, None)


# Select authentication class based on AUTH_PROVIDER
if settings.AUTH_PROVIDER == AuthProvider.DEV:
    logger.info("Using DEV authentication (local-development only)")
    OsmAuthentication = DevAuthentication
else:
    logger.info("Using Hanko SSO authentication")
    OsmAuthentication = HankoAuthentication
