import os

os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"
import os

from osm_login_python.core import Auth

# initialize osm_auth with our credentials
osm_auth = Auth(
    osm_url="https://www.openstreetmap.org",
    client_id="CZiN4--XgsFN4MWgJioJ6X5KDNadu_0Hy65XRsrdw7w",
    client_secret="T2e0zp3J20loWjFAnpoek9Xzupx7yGwHu-BiY9z3SgY",
    secret_key="my-awesome-secret-key",
    login_redirect_uri="http://127.0.0.1:8000/api/v1/auth/callback/",
    scope="read_prefs",
)


print(osm_auth.login())
request_url = "http://127.0.0.1:8000/api/v1/auth/callback/?code=2mqXshByuTZSsICeQ_NXhwdim56o4ThoZ-cI4cONs8E&state=qJEEcqKi7YVsVhXavjgPGOAQb60CuD"
osm_auth.oauth._state = "qJEEcqKi7YVsVhXavjgPGOAQb60CuD"

print(osm_auth.callback(request_url))
