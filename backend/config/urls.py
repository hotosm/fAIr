import tomllib
from pathlib import Path

from django.conf import settings
from django.conf.urls import include
from django.contrib import admin
from django.http import JsonResponse
from django.urls import path
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)
from rest_framework.settings import api_settings

from config.settings import AuthProvider

_APP_VERSION = tomllib.loads(
    (Path(__file__).resolve().parent.parent / "pyproject.toml").read_text()
)["project"]["version"]


def home(_request):
    return JsonResponse(
        {
            "name": "fAIr API",
            "app_version": _APP_VERSION,
            "api_version": api_settings.DEFAULT_VERSION,
            "schema": "/api/schema/",
            "docs": "/api/docs/",
        }
    )


admin_mapping_patterns = []
if settings.AUTH_PROVIDER == AuthProvider.HANKO:
    from hotosm_auth_django.admin_routes import create_admin_urlpatterns

    admin_mapping_patterns = create_admin_urlpatterns(
        app_name="fair",
        user_model="accounts.OsmUser",
        user_id_column="osm_id",
        user_name_column="username",
        user_email_column="email",
    )

v1_patterns = [
    path("auth/", include("accounts.urls")),
    path("", include("datasets.urls")),
    path("", include("modelregistry.urls")),
    path("", include("trainings.urls")),
    path("", include("predictions.urls")),
    path("", include("feedback.urls")),
    path("", include("notifications.urls")),
    path("", include("workspace.urls")),
    path("", include("system.urls")),
    path("", include("stars.urls")),
]

urlpatterns = [
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
    path("api/", home, name="home"),
    path("api/v1/", include((v1_patterns, "v1"), namespace="v1")),
    path("api/admin/", include(admin_mapping_patterns)),
    path("django-admin/", admin.site.urls),
]

if settings.DEBUG:
    from django.conf.urls.static import static

    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)


if settings.SERVE_FRONTEND:
    from django.http import Http404, HttpResponse
    from django.urls import re_path

    def spa_index(_request):
        """Return the bundled SPA shell for any non-API route (client-side routing).

        Intercepts all unmatched routes.
        (Everything except the API, Django admin, and static/media)
        """
        index_file = Path(settings.FRONTEND_DIST_DIR) / "index.html"
        try:
            return HttpResponse(index_file.read_bytes(), content_type="text/html")
        except FileNotFoundError as exc:
            raise Http404("Frontend bundle not found") from exc

    urlpatterns += [
        re_path(
            # We handle all URLs other than the API / Static / Admin ones
            # in the frontend. This also accounts for trailing slashes.
            r"^(?!api(/|$)|api_static/|media(/|$)|django-admin(/|$)).*$",
            spa_index,
            name="spa",
        ),
    ]
