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
from core.views import *
from django.conf.urls import include
from django.contrib import admin
from django.urls import path, re_path
from drf_yasg import openapi
from drf_yasg.views import get_schema_view
from rest_framework import permissions, routers

schema_view = get_schema_view(
    openapi.Info(
        title="fAIr API",
        default_version="v1",
        description="AI-Assisted Mapping fAIr - Checkout Detail documentation on /redoc",
        terms_of_service="https://www.google.com/policies/terms/",
        contact=openapi.Contact(email="sysadmin@hotosm.org"),
        license=openapi.License(name="BSD License"),
    ),
    public=True,
    permission_classes=[permissions.AllowAny],
)


router = routers.DefaultRouter()
router.register(r"dataset", DatasetViewSet)  # gets crud operation for the model dataset
router.register(r"aoi", AOIViewSet)  # gets crud operation for the model dataset
router.register(r"label", LabelViewSet)  # gets crud operation for the model dataset
router.register(
    r"training", TrainingViewSet
)  # gets crud operation for the model dataset
router.register(r"model", ModelViewSet)  # gets crud operation for the model dataset


urlpatterns = [
    re_path(
        r"^swagger(?P<format>\.json|\.yaml)$",
        schema_view.without_ui(cache_timeout=0),
        name="schema-json",
    ),
    re_path(
        r"^swagger/$",
        schema_view.with_ui("swagger", cache_timeout=0),
        name="schema-swagger-ui",
    ),
    re_path(
        r"^redoc/$", schema_view.with_ui("redoc", cache_timeout=0), name="schema-redoc"
    ),
    path("api/v1/auth/", include("login.urls")),  # add auth urls
    path("admin/", admin.site.urls),
    path(
        "api/v1/", include(router.urls)
    ),  # adding all the api to version 1 project is in development
    path("api/v1/fetch-raw/<int:aoi_id>/", RawdataApiView.as_view()),
    path("api/v1/dataset_image/build/", image_download_api),
    path("api/v1/download/<int:dataset_id>/", download_training_data),
    path("api/v1/training/run/<int:training_id>/", run_training),
    path("api/v1/training/run/status/<str:run_id>/", run_task_status),
]
