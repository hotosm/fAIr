import json

from django.contrib.gis.geos import GEOSException, GEOSGeometry
from shapely.errors import GEOSException as ShapelyGEOSException
from shapely.geometry import shape
from shapely.validation import make_valid

from .exceptions import handle_geometry_error


def validate_geometry(geom_data):
    if isinstance(geom_data, str):
        try:
            geom_data = json.loads(geom_data)
        except json.JSONDecodeError as exc:
            raise handle_geometry_error(
                "Unknown", "Invalid JSON in geometry field", geom_data
            ) from exc

    try:
        if isinstance(geom_data, dict):
            geos_geom = GEOSGeometry(json.dumps(geom_data))
            geom_type = geom_data.get("type", "Unknown")
        else:
            geos_geom = GEOSGeometry(geom_data)
            geom_type = geos_geom.geom_type if hasattr(geos_geom, "geom_type") else "Unknown"

        if not geos_geom.valid:
            try:
                shapely_geom = shape(
                    geom_data if isinstance(geom_data, dict) else json.loads(str(geom_data))
                )
                fixed_geom = make_valid(shapely_geom)
                geos_geom = GEOSGeometry(fixed_geom.wkt)
                if not geos_geom.valid:
                    raise handle_geometry_error(
                        geom_type, "Geometry is invalid and cannot be repaired automatically"
                    )
            except (GEOSException, ShapelyGEOSException, ValueError, TypeError) as repair_error:
                raise handle_geometry_error(
                    geom_type, f"Geometry repair failed: {repair_error!s}"
                ) from repair_error

        if geos_geom.srid != 4326:
            geos_geom.srid = 4326
        return geos_geom

    except (GEOSException, ValueError, TypeError) as e:
        geom_type = "Unknown"
        if isinstance(geom_data, dict) and "type" in geom_data:
            geom_type = geom_data["type"]
        raise handle_geometry_error(geom_type, f"Invalid geometry format: {e!s}") from e
