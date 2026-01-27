from drf_spectacular.extensions import OpenApiSerializerExtension
from drf_spectacular.plumbing import build_basic_type
from drf_spectacular.types import OpenApiTypes
from rest_framework_gis.serializers import GeoFeatureModelSerializer


class GeoFeatureModelSerializerExtension(OpenApiSerializerExtension):
    target_class = GeoFeatureModelSerializer
    match_subclasses = True

    def map_serializer(self, auto_schema, direction):
        schema = auto_schema._map_serializer(
            self.target, direction, bypass_extensions=True
        )
        
        geo_field = getattr(self.target.Meta, 'geo_field', None)
        if geo_field and 'properties' in schema and geo_field in schema['properties']:
            schema['properties'][geo_field] = build_basic_type(OpenApiTypes.OBJECT)
        
        return schema
