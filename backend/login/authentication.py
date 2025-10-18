import logging
from django.conf import settings
from osm_login_python.core import Auth
from rest_framework import authentication, exceptions

from .models import OsmUser

logger = logging.getLogger(__name__)


class OsmAuthentication(authentication.BaseAuthentication):
    def authenticate(self, request):
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
