from django.urls import path

from .views import KpiStatsView, health

urlpatterns = [
    path("health/", health, name="health"),
    path("kpi/stats/", KpiStatsView.as_view(), name="kpi-stats"),
]
