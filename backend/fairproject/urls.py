"""djangoproject URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/3.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from core.views import home
from django.conf import settings
from fairproject.settings import AuthProvider
from django.conf.urls import include
from django.contrib import admin
from django.urls import path
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

admin_mapping_patterns = []
if settings.AUTH_PROVIDER == AuthProvider.HANKO:
    from hotosm_auth_django.admin_routes import create_admin_urlpatterns
    admin_mapping_patterns = create_admin_urlpatterns(
        app_name="fair",
        user_model="login.OsmUser",
        user_id_column="osm_id",
        user_name_column="username",
        user_email_column="email",
    )

urlpatterns = [
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/swagger/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
    path("api/", home, name="home"),
    path("api/v1/auth/", include("login.urls")),
    path("api/v1/", include("core.urls")),
    path("api/admin/", include(admin_mapping_patterns)),
    path("django-admin/", admin.site.urls),
]

if settings.DEBUG:
    from django.conf.urls.static import static
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
