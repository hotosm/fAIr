from django.core.exceptions import ValidationError
from django.contrib.gis.geos import GEOSGeometry, GEOSException
from shapely.geometry import shape
from shapely.validation import make_valid
import json

from .exceptions import (
    GeometryValidationException,
    ValidationException,
    handle_geometry_error,
    handle_validation_error
)


def validate_geometry(geom_data):
    if isinstance(geom_data, str):
        try:
            geom_data = json.loads(geom_data)
        except json.JSONDecodeError:
            raise handle_geometry_error(
                "Unknown", 
                "Invalid JSON in geometry field",
                geom_data
            )
    
    try:
        if isinstance(geom_data, dict):
            geos_geom = GEOSGeometry(json.dumps(geom_data))
            geom_type = geom_data.get('type', 'Unknown')
        else:
            geos_geom = GEOSGeometry(geom_data)
            geom_type = geos_geom.geom_type if hasattr(geos_geom, 'geom_type') else 'Unknown'
        
        if not geos_geom.valid:
            try:
                shapely_geom = shape(geom_data if isinstance(geom_data, dict) else json.loads(str(geom_data)))
                fixed_geom = make_valid(shapely_geom)
                geos_geom = GEOSGeometry(fixed_geom.wkt)
                
                if not geos_geom.valid:
                    raise handle_geometry_error(geom_type, "Geometry is invalid and cannot be repaired automatically")
            except Exception as repair_error:
                raise handle_geometry_error(geom_type, f"Geometry repair failed: {str(repair_error)}")
        
        if geos_geom.srid != 4326:
            geos_geom.srid = 4326
        
        return geos_geom
    
    except (GEOSException, ValueError, TypeError) as e:
        geom_type = 'Unknown'
        if isinstance(geom_data, dict) and 'type' in geom_data:
            geom_type = geom_data['type']
            
        raise handle_geometry_error(geom_type, f"Invalid geometry format: {str(e)}")


def validate_bbox(bbox):
    if not isinstance(bbox, (list, tuple)) or len(bbox) != 4:
        raise handle_validation_error("bbox", "Bounding box must be a list of 4 coordinates [minx, miny, maxx, maxy]", bbox)
    
    minx, miny, maxx, maxy = bbox
    
    if not all(isinstance(coord, (int, float)) for coord in bbox):
        raise handle_validation_error("bbox", "All bounding box coordinates must be numeric", bbox)
    
    if minx >= maxx or miny >= maxy:
        raise handle_validation_error("bbox", "Invalid bounding box: min values must be less than max values", bbox)
    
    if not (-180 <= minx <= 180 and -180 <= maxx <= 180):
        raise handle_validation_error("bbox", "Longitude values must be between -180 and 180", bbox)
    
    if not (-90 <= miny <= 90 and -90 <= maxy <= 90):
        raise handle_validation_error("bbox", "Latitude values must be between -90 and 90", bbox)
    
    return bbox


def validate_geojson(geojson_data):
    if isinstance(geojson_data, str):
        try:
            geojson_data = json.loads(geojson_data)
        except json.JSONDecodeError:
            raise handle_validation_error("geojson", "Invalid JSON in GeoJSON field", geojson_data)
    
    if not isinstance(geojson_data, dict):
        raise handle_validation_error("geojson", "GeoJSON must be a dictionary", type(geojson_data).__name__)
    
    if 'type' not in geojson_data:
        raise handle_validation_error("geojson", "GeoJSON must have a 'type' field")
    
    geojson_type = geojson_data['type']
    
    if geojson_type == 'FeatureCollection':
        if 'features' not in geojson_data:
            raise handle_validation_error("geojson", "FeatureCollection must have a 'features' field")
        for i, feature in enumerate(geojson_data['features']):
            try:
                validate_geojson_feature(feature)
            except (ValidationException, GeometryValidationException) as e:
                e.details['feature_index'] = i
                raise e
    
    elif geojson_type == 'Feature':
        validate_geojson_feature(geojson_data)
    
    elif geojson_type in ['Point', 'LineString', 'Polygon', 'MultiPoint', 'MultiLineString', 'MultiPolygon']:
        validate_geometry(geojson_data)
    
    else:
        raise handle_validation_error("geojson", f"Unsupported GeoJSON type: {geojson_type}", geojson_type)
    
    return geojson_data


def validate_geojson_feature(feature):
    if not isinstance(feature, dict):
        raise handle_validation_error("geojson_feature", "Feature must be a dictionary", type(feature).__name__)
    
    if feature.get('type') != 'Feature':
        raise handle_validation_error("geojson_feature", "Feature must have type 'Feature'", feature.get('type'))
    
    if 'geometry' not in feature:
        raise handle_validation_error("geojson_feature", "Feature must have a 'geometry' field")
    
    if feature['geometry'] is not None:
        validate_geometry(feature['geometry'])
    
    return feature