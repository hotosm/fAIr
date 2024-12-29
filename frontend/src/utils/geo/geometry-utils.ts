import {
  Feature,
  FeatureCollection,
  Geometry,
  TModelPredictions,
} from "@/types";
import bboxPolygon from "@turf/bbox";
import { booleanIntersects } from "@turf/boolean-intersects";
import area from "@turf/area";
import { LngLatBoundsLike, Map } from "maplibre-gl";
import { roundNumber } from "../number-utils";
import { uuid4 } from "../general-utils";
import { TModelPredictionsConfig } from "@/features/start-mapping/api/get-model-predictions";

/**
 * Calculates the area of a GeoJSON Feature or FeatureCollection.
 *
 * This function computes the area of the provided GeoJSON object.
 * The result is returned as a numeric value representing the area
 * in square meters, based on the GeoJSON geometry.
 *
 * @param {Feature | FeatureCollection} geojsonFeature - The GeoJSON object
 * representing a single Feature or a collection of Features.
 *
 * @returns {number} The calculated area of the GeoJSON feature in square meters.
 */
export const calculateGeoJSONArea = (
  geojsonFeature: Feature | FeatureCollection,
): number => {
  return area(geojsonFeature);
};

/**
 * Format area into human readable string.
 *
 * This function formats an area in square meters into human readable string.
 *
 * @param {number} area - The area in square meters to transform.
 *
 * @returns {string} The result as 12,222,000 m² or 12,222 km²
 */

export const formatAreaInAppropriateUnit = (area: number): string => {
  if (area > 1000000) {
    return roundNumber(area / 1000000, 1).toLocaleString() + "km²";
  }
  return roundNumber(area, 1).toLocaleString() + "m²";
};
/**
 * Computes the bounding box of a GeoJSON Feature.
 *
 * This function calculates the minimum bounding box that fully contains
 * the given GeoJSON feature. The bounding box is returned in the form
 * of an array with four values representing [west, south, east, north] coordinates.
 *
 * @param {Feature} geojsonFeature - The GeoJSON feature for which to calculate the bounding box.
 *
 * @returns {LngLatBoundsLike} The bounding box as an array of coordinates
 * in the format [west, south, east, north].
 */

export const getGeoJSONFeatureBounds = (
  geojsonFeature: Feature,
): LngLatBoundsLike => {
  // @ts-expect-error bad type definition
  return bboxPolygon(geojsonFeature) as [number, number, number, number];
};

// Ref - https://github.com/hotosm/fAIr/blob/master/frontend/src/utils.js

/**
 * Converts degrees to radians.
 *
 * This function takes an angle in degrees and converts it to radians.
 * @param {number} degrees - The angle in degrees to be converted.
 *
 * @returns {number} The angle in radians.
 */
const degrees_to_radians = (degrees: number): number => {
  const pi = Math.PI;
  return degrees * (pi / 180);
};

/**
 * Converts geographic coordinates (latitude and longitude) into tile numbers (xtile, ytile)
 * for a specified zoom level.
 *
 * @param {number} lat_deg - The latitude in degrees.
 * @param {number} lon_deg - The longitude in degrees.
 * @param {number} zoom - The zoom level to determine the tile numbers.
 *
 * @returns {Object} An object containing:
 *  - `xtile` {number}: The tile number on the x-axis.
 *  - `ytile` {number}: The tile number on the y-axis.
 */
const deg2num = (
  lat_deg: number,
  lon_deg: number,
  zoom: number,
): { xtile: number; ytile: number } => {
  const lat_rad = degrees_to_radians(lat_deg);
  const n = Math.pow(2.0, zoom);

  const xtile = Math.floor(((lon_deg + 180.0) / 360.0) * n);

  const ytile = Math.floor(
    ((1.0 - Math.asinh(Math.tan(lat_rad)) / Math.PI) / 2.0) * n,
  );
  return { xtile, ytile };
};

/**
 * Converts radians to degrees.
 *
 * This function takes an angle in radians and converts it to degress.
 * @param {number} radians - The angle in radians to be converted.
 *
 * @returns {number} The angle in degress.
 */
const radians_to_degrees = (radians: number): number => {
  const pi = Math.PI;
  return radians * (180 / pi);
};

/**
 * Converts tile numbers (xtile, ytile) at a specific zoom level back to geographic coordinates (latitude and longitude in degrees).
 *
 * @param {number} xtile - The x-axis tile number.
 * @param {number} ytile - The y-axis tile number.
 * @param {number} zoom - The zoom level used for the tile coordinates.
 *
 * @returns {Object} An object containing:
 *  - `lat_deg` {number}: The latitude in degrees.
 *  - `lon_deg` {number}: The longitude in degrees.
 */
const num2deg = (
  xtile: number,
  ytile: number,
  zoom: number,
): { lat_deg: number; lon_deg: number } => {
  const n = Math.pow(2.0, zoom);
  const lon_deg = (xtile / n) * 360.0 - 180.0;
  const lat_rad = Math.atan(Math.sinh(Math.PI * (1 - (2 * ytile) / n)));
  const lat_deg = radians_to_degrees(lat_rad);
  return { lat_deg, lon_deg };
};

/**
 * Calculates the distance between two geographic coordinates (latitude and longitude) in a specified unit.
 * Uses the Haversine formula to calculate distances on the Earth's surface.
 *
 * @param {number} lat1 - Latitude of the first point in decimal degrees.
 * @param {number} lon1 - Longitude of the first point in decimal degrees.
 * @param {number} lat2 - Latitude of the second point in decimal degrees.
 * @param {number} lon2 - Longitude of the second point in decimal degrees.
 * @param {"K" | "N" | "M"} unit - The unit of measurement for the returned distance:
 *  - "K" for kilometers
 *  - "N" for nautical miles
 *  - "M" for miles
 *
 * @returns {number} The distance between the two points in the specified unit.
 */
export const distance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  unit: "K" | "N" | "M",
): number => {
  if (lat1 === lat2 && lon1 === lon2) {
    return 0;
  } else {
    const radlat1 = (Math.PI * lat1) / 180;
    const radlat2 = (Math.PI * lat2) / 180;
    const theta = lon1 - lon2;
    const radtheta = (Math.PI * theta) / 180;
    let dist =
      Math.sin(radlat1) * Math.sin(radlat2) +
      Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
    if (dist > 1) {
      dist = 1;
    }
    dist = Math.acos(dist);
    dist = (dist * 180) / Math.PI;
    dist = dist * 60 * 1.1515;
    if (unit === "K") {
      dist = dist * 1.609344;
    }
    if (unit === "N") {
      dist = dist * 0.8684;
    }
    return dist;
  }
};

/**
 * Finds the geographic coordinates of the closest tile corner to a given latitude and longitude
 * at a specified zoom level.
 *
 * @param {number} lat - The latitude in decimal degrees of the target location.
 * @param {number} lon - The longitude in decimal degrees of the target location.
 * @param {number} zoom - The zoom level, defining the granularity of the tiles.
 *
 * @returns {{ lat_deg: number; lon_deg: number } | null} - The closest corner's geographic coordinates
 * in decimal degrees, or `null` if no corner is found.
 */
const getClosestCorner = (
  lat: number,
  lon: number,
  zoom: number,
): { lat_deg: number; lon_deg: number } | null => {
  const tile = deg2num(lat, lon, zoom);
  let shortest = Infinity;
  let closestGeo: { lat_deg: number; lon_deg: number } | null = null;

  for (let indexX = tile.xtile; indexX <= tile.xtile + 1; indexX++) {
    for (let indexY = tile.ytile; indexY <= tile.ytile + 1; indexY++) {
      const geo = num2deg(indexX, indexY, zoom);
      const distanceInKM = distance(lat, lon, geo.lat_deg, geo.lon_deg, "K");
      if (distanceInKM < shortest) {
        shortest = distanceInKM;
        closestGeo = geo;
      }
    }
  }

  return closestGeo;
};

/**
 * Approximates the given set of coordinates to the nearest corner tiles at a specified zoom level.
 *
 * @param {Array<[number, number]>} coordinates - An array of coordinate pairs [longitude, latitude] to approximate.
 * @param {number} [zoom=19] - The zoom level used to calculate the closest tile corners (default is 19).
 *
 * @returns {Array<[number, number]>} - An array of the approximated coordinates, where each point is replaced by
 * the closest tile corner at the specified zoom level.
 */
export const approximateGeom = (
  coordinates: [number, number][],
  zoom = 19,
): [number, number][] => {
  return coordinates.map(([lon, lat]) => {
    const closest = getClosestCorner(lat, lon, zoom);
    return closest ? [closest.lon_deg, closest.lat_deg] : [lon, lat];
  });
};

/**
 * Generates a GeoJSON FeatureCollection representing the boundaries of map tiles
 * within the current visible bounds at a specified zoom level.
 *
 * @param {Map} map - The Map instance representing the map where the tiles are located.
 * @param {number} zoom - The zoom level to calculate the tile boundaries.
 *
 * @returns {FeatureCollection} - A GeoJSON FeatureCollection containing polygons that define the boundaries
 * of each tile within the visible map bounds at the given zoom level.
 */
export const getTileBoundariesGeoJSON = (
  map: Map,
  zoom: number,
): FeatureCollection => {
  const bounds = map.getBounds();

  const minTile = deg2num(bounds.getNorth(), bounds.getWest(), zoom);
  const maxTile = deg2num(bounds.getSouth(), bounds.getEast(), zoom);

  const features: Feature[] = [];

  for (let x = minTile.xtile; x <= maxTile.xtile; x++) {
    for (let y = minTile.ytile; y <= maxTile.ytile; y++) {
      const { lat_deg: lat1, lon_deg: lon1 } = num2deg(x, y, zoom);
      const { lat_deg: lat2, lon_deg: lon2 } = num2deg(x + 1, y + 1, zoom);

      features.push({
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [lon1, lat1],
              [lon2, lat1],
              [lon2, lat2],
              [lon1, lat2],
              [lon1, lat1],
            ],
          ],
        },
        properties: { xtile: x, ytile: y, zoom },
      });
    }
  }
  return {
    type: "FeatureCollection",
    features,
  };
};

/**
 * Snaps the coordinates of a GeoJSON geometry to the closest map tile boundaries
 * based on the current zoom level, by approximating each coordinate to the nearest
 * corner of a map tile.
 *
 * @param {Geometry} geometry - The GeoJSON geometry whose coordinates need to be snapped.
 *
 * @returns {Geometry} - The updated GeoJSON geometry with its coordinates snapped
 * to the closest tile boundaries.
 */
export const snapGeoJSONGeometryToClosestTile = (geometry: Geometry) => {
  const originalCoordinates = geometry.coordinates[0];
  const snappedCoordinates = approximateGeom(originalCoordinates);
  geometry.coordinates[0] = snappedCoordinates;
  return geometry;
};

/*
  Logic.
  | 1 - Purple: Will be replaced with new feature if it intersects with new features, otherwise, it'll be appended.
  | 2 - Red: No touch                        
  | 3 - Green: No touch                         
*/
export const handleConflation = (
  existingPredictions: TModelPredictions,
  newFeatures: Feature[],
  predictionConfig: TModelPredictionsConfig,
): TModelPredictions => {
  let updatedAll = [...existingPredictions.all];

  newFeatures.forEach((newFeature) => {
    const intersectsWithAccepted = existingPredictions.accepted.some(
      (acceptedFeature) => booleanIntersects(newFeature, acceptedFeature),
    );
    const intersectsWithRejected = existingPredictions.rejected.some(
      (rejectedFeature) => booleanIntersects(newFeature, rejectedFeature),
    );

    const intersectingIndex = updatedAll.findIndex((existingFeature) =>
      booleanIntersects(newFeature, existingFeature),
    );

    if (intersectingIndex !== -1) {
      updatedAll[intersectingIndex] = {
        ...newFeature,
        properties: {
          ...newFeature.properties,
          id: updatedAll[intersectingIndex].properties?.id || uuid4(),
          config: predictionConfig,
        },
      };
    } else if (!intersectsWithAccepted && !intersectsWithRejected) {
      updatedAll.push({
        ...newFeature,
        properties: {
          ...newFeature.properties,
          id: uuid4(),
          config: predictionConfig,
        },
      });
    }
  });

  return {
    all: updatedAll,
    accepted: existingPredictions.accepted,
    rejected: existingPredictions.rejected,
  };
};
