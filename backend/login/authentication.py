import logging
from django.conf import settings
from rest_framework import authentication, exceptions

from .models import OsmUser

logger = logging.getLogger(__name__)


class LegacyOsmAuthentication(authentication.BaseAuthentication):
    """Legacy OSM OAuth authentication using osm_login_python.

    Used when AUTH_PROVIDER="legacy".
    Reads access-token from header and validates directly with OSM.
    """
    def authenticate(self, request):
        from osm_login_python.core import Auth

        access_token = request.headers.get(
            "access-token"
        )  # get the access token as header
        user = None
        if access_token:
            try:
                osm_auth = Auth(
                    osm_url=settings.OSM_URL,
                    client_id=settings.OSM_CLIENT_ID,
                    client_secret=settings.OSM_CLIENT_SECRET,
                    secret_key=settings.OSM_SECRET_KEY,
                    login_redirect_uri=settings.OSM_LOGIN_REDIRECT_URI,
                    scope=settings.OSM_SCOPE,
                )
                user_data = osm_auth.deserialize_data(access_token)  # get the user
                try:
                    user = OsmUser.objects.get(osm_id=user_data["id"])

                    if user.username != user_data["username"]:  # if username changed
                        user.username = user_data["username"]
                    if user.img_url != user_data["img_url"]:  # if img url changed
                        user.img_url = user_data["img_url"]
                    user.save()

                except OsmUser.DoesNotExist:
                    user = OsmUser.objects.create(
                        osm_id=user_data["id"],
                        username=user_data["username"],
                        img_url=user_data["img_url"],
                    )

            except Exception as ex:
                logger.warning(
                    "OSM authentication failed",
                    extra={
                        "error": str(ex),
                        "access_token_length": len(access_token) if access_token else 0,
                        "osm_url": settings.OSM_URL
                    }
                )
                raise exceptions.AuthenticationFailed(
                    "OSM authentication failed: Invalid or expired access token"
                )
        return (user, None)


class HankoAuthentication(authentication.BaseAuthentication):
    """Hanko SSO authentication with user mapping.

    Used when AUTH_PROVIDER="hanko".
    Reads Hanko JWT from cookie (via HankoAuthMiddleware).

    Flow:
    1. Check if hanko_user_mappings has entry for this hanko_id
    2. If yes → use mapped osm_id to get user
    3. If no → user needs onboarding (set request.needs_onboarding = True)

    The onboarding flow asks "Do you have an existing fAIr account?"
    - Yes → Connect OSM to recover account
    - No → Create account with synthetic (negative) osm_id
    """
    def authenticate(self, request):
        from hotosm_auth.integrations.django import get_mapped_user_id

        # HankoAuthMiddleware adds request.hotosm with user and osm
        if not hasattr(request, 'hotosm'):
            logger.debug("No hotosm attribute on request - HankoAuthMiddleware not active")
            return (None, None)

        hanko_user = request.hotosm.user

        # If no Hanko user, not authenticated
        if not hanko_user:
            logger.debug("No Hanko user in request")
            return (None, None)

        # Check if mapping exists for this Hanko user
        mapped_osm_id = get_mapped_user_id(hanko_user, app_name="fair")

        if mapped_osm_id is not None:
            # Mapping exists - get the user by osm_id
            try:
                osm_id = int(mapped_osm_id)
                user = OsmUser.objects.get(osm_id=osm_id)
                logger.debug(f"Authenticated via mapping: Hanko={hanko_user.email}, osm_id={osm_id}")
                return (user, None)
            except (OsmUser.DoesNotExist, ValueError) as e:
                logger.warning(f"Mapping exists but user not found: osm_id={mapped_osm_id}, error={e}")
                # Fall through to onboarding

        # No mapping - user needs onboarding
        # Set flag so views can detect this
        request.needs_onboarding = True
        request.hanko_user_for_onboarding = hanko_user
        logger.debug(f"Hanko user {hanko_user.email} needs onboarding (no mapping)")
        return (None, None)


# =============================================================================
# Select authentication class based on AUTH_PROVIDER
# =============================================================================
if getattr(settings, 'AUTH_PROVIDER', 'legacy') == 'hanko':
    logger.info("🔐 Using Hanko SSO authentication")
    OsmAuthentication = HankoAuthentication
else:
    logger.info("🔐 Using legacy OSM authentication")
    OsmAuthentication = LegacyOsmAuthentication
