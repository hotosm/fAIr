from django.conf import settings
from osm_login_python.core import Auth
from rest_framework import authentication, exceptions

from .models import OsmUser

# initialize osm_auth with our credentials


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
                user_data = osm_auth.deserialize_access_token(
                    access_token
                )  # get the user
                try:
                    user = OsmUser.objects.get(osm_id=user_data["id"])
                except OsmUser.DoesNotExist:
                    user = OsmUser.objects.create(
                        osm_id=user_data["id"],
                        username=user_data["username"],
                        img_url=user_data["img_url"],
                    )

            except Exception as ex:
                print(ex)
                raise exceptions.AuthenticationFailed(
                    "Osm Authentication Failed"
                )  # raise exception if user does not exist
        return (user, None)  # authentication successful return id,user_name,img
