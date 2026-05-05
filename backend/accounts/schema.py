"""drf-spectacular extensions binding our custom auth classes to OpenAPI.

Without these, every view warns "could not resolve authenticator" on schema
generation. Both DevAuthentication and HankoAuthentication share the same
public contract: an `access-token` header.
"""

from drf_spectacular.extensions import OpenApiAuthenticationExtension


class _OsmAuthScheme(OpenApiAuthenticationExtension):
    name = "OsmAuth"

    def get_security_definition(self, auto_schema):
        return {
            "type": "apiKey",
            "in": "header",
            "name": "access-token",
            "description": (
                "Bearer token: Hanko-issued in prod (AUTH_PROVIDER=hanko), "
                "or FAIR_DEV_TOKEN locally (AUTH_PROVIDER=dev)."
            ),
        }


class DevAuthScheme(_OsmAuthScheme):
    target_class = "accounts.authentication.DevAuthentication"


class HankoAuthScheme(_OsmAuthScheme):
    target_class = "accounts.authentication.HankoAuthentication"
