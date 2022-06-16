from rest_framework import serializers
from .models import *
from rest_framework_gis.serializers import GeoFeatureModelSerializer # this will be used if we used to serialize as geojson 

class DatasetSerializer(serializers.ModelSerializer): # serializers are used to translate models objects to api 
    class Meta:
        model = Dataset
        fields = '__all__' # defining all the fields to  be included in curd for now , we can restrict few if we want 


class AOISerializer(GeoFeatureModelSerializer): # serializers are used to translate models objects to api 
    class Meta:
        model = AOI
        geo_field='geom' # this will be used as geometry in order to create geojson api , geofeatureserializer will let you create api in geojson 
        fields = '__all__' # defining all the fields to  be included in curd for now , we can restrict few if we want 

class LabelSerializer(GeoFeatureModelSerializer): # serializers are used to translate models objects to api 
    class Meta:
        model = Label
        geo_field='geom' # this will be used as geometry in order to create geojson api , geofeatureserializer will let you create api in geojson 
        auto_bbox = True
        fields = '__all__' # defining all the fields to  be included in curd for now , we can restrict few if we want 

