from django.contrib import admin

from .models import OsmUser

# Register your models here.


@admin.register(OsmUser)
class DatasetAdmin(admin.ModelAdmin):
    list_display = ["osm_id", "username"]
