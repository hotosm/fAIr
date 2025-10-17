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
from django.conf.urls import include
from django.contrib import admin
from django.urls import path, re_path
from drf_yasg import openapi
from drf_yasg.views import get_schema_view
from rest_framework import permissions

api_info = openapi.Info(
    title="fAIr API",
    default_version="v1",
    description="""
# AI-Assisted Mapping fAIr API

## Overview
fAIr enables AI-powered building detection and mapping using satellite imagery.

## Authentication
Most endpoints require authentication using OSM OAuth2:
1. Get access token: `POST /api/v1/auth/login/`
2. Use token in header: `access-token: YOUR_TOKEN`

## Typical Workflow
1. **Create Dataset** → Define imagery source
2. **Create AOI** → Define mapping area with polygon
3. **Add Labels** → REQUIRED! Either:
   - Fetch from OSM: `POST /api/v1/label/osm/fetch/{aoi_id}/`
   - Upload GeoJSON: `POST /api/v1/label/geojson/upload/{aoi_id}/`
4. **Create Model** → Initialize AI model
5. **Start Training** → Train model (will fail without labels!)
6. **Run Prediction** → Run inference on new areas
7. **Submit Feedback** → Accept/reject predictions

## Resources
- Detailed Docs: `/api/redoc/`
- OpenAPI Schema: `/api/swagger.json`
- Contact: sysadmin@hotosm.org
    """,
    terms_of_service="https://www.hotosm.org/privacy",
    contact=openapi.Contact(email="sysadmin@hotosm.org", name="HOT Tech Team"),
    license=openapi.License(name="AGPL-3.0", url="https://www.gnu.org/licenses/agpl-3.0.en.html"),
)

schema_view = get_schema_view(
    api_info,
    public=True,
    permission_classes=[permissions.AllowAny],
)


urlpatterns = [
    re_path(
        r"^api/swagger(?P<format>\.json|\.yaml)$",
        schema_view.without_ui(cache_timeout=0),
        name="schema-json",
    ),
    re_path(
        r"^api/swagger/$",
        schema_view.with_ui("swagger", cache_timeout=0),
        name="schema-swagger-ui",
    ),
    re_path(
        r"^api/redoc/$",
        schema_view.with_ui("redoc", cache_timeout=0),
        name="schema-redoc",
    ),
    path("api/", home, name="home"),
    path("api/v1/auth/", include("login.urls")),  # add auth urls
    path("api/v1/", include("core.urls")),  # add core urls
    path("api/admin/", admin.site.urls),
]
