import logging
from django.conf import settings
from fairproject.settings import AuthProvider
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
        # if not access_token: # no access token passed on header
        #     raise exceptions.AuthenticationFailed('Access token not supplied')
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
        return (user, None)  # authentication successful return id,user_name,img


class HankoAuthentication(authentication.BaseAuthentication):
    """Hanko SSO authentication using user mappings."""
    def authenticate(self, request):
        from hotosm_auth_django import get_mapped_user_id

        if not hasattr(request, 'hotosm'):
            raise exceptions.AuthenticationFailed(
                "HankoAuthMiddleware not configured"
            )

        hanko_user = request.hotosm.user

        if not hanko_user:
            logger.debug("No Hanko user in request")
            return (None, None)

        mapped_osm_id = get_mapped_user_id(hanko_user, app_name="fair")

        if mapped_osm_id is not None:
            try:
                osm_id = int(mapped_osm_id)
                user = OsmUser.objects.get(osm_id=osm_id)
                logger.debug(f"Authenticated via mapping: Hanko={hanko_user.email}, osm_id={osm_id}")
                return (user, None)
            except (OsmUser.DoesNotExist, ValueError) as e:
                logger.warning(f"Mapping exists but user not found: osm_id={mapped_osm_id}, error={e}")
                # Fall through to onboarding.

        request.needs_onboarding = True
        request.hanko_user_for_onboarding = hanko_user
        logger.debug(f"Hanko user {hanko_user.email} needs onboarding (no mapping)")
        return (None, None)


# Select authentication class based on AUTH_PROVIDER
if settings.AUTH_PROVIDER == AuthProvider.HANKO:
    logger.info("Using Hanko SSO authentication")
    OsmAuthentication = HankoAuthentication
else:
    logger.info("Using legacy OSM authentication")
    OsmAuthentication = LegacyOsmAuthentication
