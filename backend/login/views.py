from django.conf import settings
from osm_login_python.core import Auth
from django.http import JsonResponse
import json
from rest_framework.decorators import authentication_classes, permission_classes
from login.authentication import OsmAuthentication
from login.permissions import IsOsmAuthenticated
from rest_framework.views import APIView
# Create your views here.
# initialize osm_auth with our credentials
osm_auth=Auth(osm_url=settings.OSM_URL, client_id=settings.OSM_CLIENT_ID,client_secret=settings.OSM_CLIENT_SECRET, secret_key=settings.OSM_SECRET_KEY, login_redirect_uri=settings.OSM_LOGIN_REDIRECT_URI, scope=settings.OSM_SCOPE)

def login(request):
    """Generates login url for OSM Login

    Args:
        request (get): _description_

    Returns:
        json: login_url
    """
    login_url=osm_auth.login()
    return JsonResponse(json.loads(login_url))

def callback(request):
    """Callback method redirected from osm callback method

    Args:
        request (_type_): contains code and state as parametr redirected from osm

    Returns:
        json: access_token
    """
    # Generating token through osm_auth library method
    token=osm_auth.callback(request.build_absolute_uri())
    return JsonResponse(json.loads(token))


class GetMyData(APIView):
    authentication_classes = [OsmAuthentication]
    permission_classes = [IsOsmAuthenticated]

    def get(self, request, format=None):
        return JsonResponse(request.user)


