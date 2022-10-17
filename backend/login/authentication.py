from rest_framework import authentication
from rest_framework import exceptions
from django.conf import settings
from osm_auth.app import Auth

# initialize osm_auth with our credentials

class OsmAuthentication(authentication.BaseAuthentication):
    def authenticate(self, request):
        access_token = request.headers.get('access-token') # get the access token as header
        if not access_token: # no access token passed on header
            return None # authentication did not succeed
        try:
            osm_auth=Auth(osm_url=settings.OSM_URL, client_id=settings.OSM_CLIENT_ID,client_secret=settings.OSM_CLIENT_SECRET, secret_key=settings.OSM_SECRET_KEY, login_redirect_uri=settings.OSM_LOGIN_REDIRECT_URI, scope=settings.OSM_SCOPE)
            user_data=osm_auth.deserialize_access_token(access_token) # get the user
        except Exception as ex:
            raise exceptions.AuthenticationFailed('Osm Authentication Failed') # raise exception if user does not exist
        return (user_data, None) # authentication successful return id,user_name,img