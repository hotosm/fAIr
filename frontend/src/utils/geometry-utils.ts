import { Feature, FeatureCollection, Geometry } from "@/types";
import bboxPolygon from "@turf/bbox";

import area from "@turf/area";
import { LngLatBoundsLike, Map } from "maplibre-gl";

export const calculateGeoJSONArea = (
  geojsonFeature: Feature | FeatureCollection,
): number => {
  return area(geojsonFeature);
};

export const getGeoJSONFeatureBounds = (
  geojsonFeature: Feature,
): LngLatBoundsLike => {
  // @ts-expect-error bad type definition
  return bboxPolygon(geojsonFeature) as [number, number, number, number];
};

// Ref - https://github.com/hotosm/fAIr/blob/master/frontend/src/utils.js

// Converts degrees to radians
const degrees_to_radians = (degrees: number): number => {
  const pi = Math.PI;
  return degrees * (pi / 180);
};

// Converts latitude and longitude in degrees to tile numbers (xtile, ytile) at a specific zoom level
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

// Converts radians to degrees
const radians_to_degrees = (radians: number): number => {
  const pi = Math.PI;
  return radians * (180 / pi);
};

// Converts tile numbers (xtile, ytile) back to latitude and longitude at a specific zoom level
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

// Calculates the distance between two geographical points (lat1, lon1) and (lat2, lon2)
// Returns the distance in the specified unit (Kilometers 'K', Nautical Miles 'N', Miles 'M')
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

export const approximateGeom = (
  coordinates: [number, number][],
  zoom = 19,
): [number, number][] => {
  return coordinates.map(([lon, lat]) => {
    const closest = getClosestCorner(lat, lon, zoom);
    return closest ? [closest.lon_deg, closest.lat_deg] : [lon, lat];
  });
};

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

export const snapGeoJSONGeometryToClosestTile = (geometry: Geometry) => {
  const originalCoordinates = geometry.coordinates[0];
  const snappedCoordinates = approximateGeom(originalCoordinates);
  geometry.coordinates[0] = snappedCoordinates;
  return geometry;
};
