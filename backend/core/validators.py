from django.core.exceptions import ValidationError
from django.contrib.gis.geos import GEOSGeometry, GEOSException
from shapely.geometry import shape
from shapely.validation import make_valid
import json


def validate_geometry(geom_data):
    if isinstance(geom_data, str):
        try:
            geom_data = json.loads(geom_data)
        except json.JSONDecodeError:
            raise ValidationError("Invalid JSON in geometry field")
    
    try:
        if isinstance(geom_data, dict):
            geos_geom = GEOSGeometry(json.dumps(geom_data))
        else:
            geos_geom = GEOSGeometry(geom_data)
        
        if not geos_geom.valid:
            try:
                shapely_geom = shape(geom_data if isinstance(geom_data, dict) else json.loads(str(geom_data)))
                fixed_geom = make_valid(shapely_geom)
                geos_geom = GEOSGeometry(fixed_geom.wkt)
            except Exception:
                raise ValidationError("Geometry is invalid and cannot be repaired")
        
        if geos_geom.srid != 4326:
            geos_geom.srid = 4326
        
        return geos_geom
    
    except (GEOSException, ValueError, TypeError) as e:
        raise ValidationError(f"Invalid geometry: {str(e)}")


def validate_bbox(bbox):
    if not isinstance(bbox, (list, tuple)) or len(bbox) != 4:
        raise ValidationError("Bounding box must be a list of 4 coordinates [minx, miny, maxx, maxy]")
    
    minx, miny, maxx, maxy = bbox
    
    if not all(isinstance(coord, (int, float)) for coord in bbox):
        raise ValidationError("All bounding box coordinates must be numeric")
    
    if minx >= maxx or miny >= maxy:
        raise ValidationError("Invalid bounding box: min values must be less than max values")
    
    if not (-180 <= minx <= 180 and -180 <= maxx <= 180):
        raise ValidationError("Longitude values must be between -180 and 180")
    
    if not (-90 <= miny <= 90 and -90 <= maxy <= 90):
        raise ValidationError("Latitude values must be between -90 and 90")
    
    return bbox


def validate_geojson(geojson_data):
    if isinstance(geojson_data, str):
        try:
            geojson_data = json.loads(geojson_data)
        except json.JSONDecodeError:
            raise ValidationError("Invalid JSON in GeoJSON field")
    
    if not isinstance(geojson_data, dict):
        raise ValidationError("GeoJSON must be a dictionary")
    
    if 'type' not in geojson_data:
        raise ValidationError("GeoJSON must have a 'type' field")
    
    geojson_type = geojson_data['type']
    
    if geojson_type == 'FeatureCollection':
        if 'features' not in geojson_data:
            raise ValidationError("FeatureCollection must have a 'features' field")
        for feature in geojson_data['features']:
            validate_geojson_feature(feature)
    
    elif geojson_type == 'Feature':
        validate_geojson_feature(geojson_data)
    
    elif geojson_type in ['Point', 'LineString', 'Polygon', 'MultiPoint', 'MultiLineString', 'MultiPolygon']:
        validate_geometry(geojson_data)
    
    else:
        raise ValidationError(f"Unsupported GeoJSON type: {geojson_type}")
    
    return geojson_data


def validate_geojson_feature(feature):
    if not isinstance(feature, dict):
        raise ValidationError("Feature must be a dictionary")
    
    if feature.get('type') != 'Feature':
        raise ValidationError("Feature must have type 'Feature'")
    
    if 'geometry' not in feature:
        raise ValidationError("Feature must have a 'geometry' field")
    
    if feature['geometry'] is not None:
        validate_geometry(feature['geometry'])
    
    return feature