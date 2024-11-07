import { Feature } from "@/types";
import bboxPolygon from "@turf/bbox";

import area from "@turf/area";
import { LngLatBoundsLike } from "maplibre-gl";

export const calculateGeoJSONFeatureArea = (
  geojsonFeature: Feature,
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
  const n = Math.pow(2.0, zoom); // Calculate number of tiles at the given zoom level
  const xtile = Math.floor(((lon_deg + 180.0) / 360.0) * n); // Calculate tile number in x direction (longitude)
  const ytile = Math.floor(
    ((1.0 - Math.asinh(Math.tan(lat_rad)) / Math.PI) / 2.0) * n, // Calculate tile number in y direction (latitude)
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
  const n = Math.pow(2.0, zoom); // Calculate number of tiles at the given zoom level
  const lon_deg = (xtile / n) * 360.0 - 180.0; // Convert xtile to longitude
  const lat_rad = Math.atan(Math.sinh(Math.PI * (1 - (2 * ytile) / n))); // Convert ytile to latitude (in radians)
  const lat_deg = radians_to_degrees(lat_rad); // Convert latitude from radians to degrees
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
    return 0; // If the points are the same, distance is 0
  } else {
    const radlat1 = (Math.PI * lat1) / 180;
    const radlat2 = (Math.PI * lat2) / 180;
    const theta = lon1 - lon2;
    const radtheta = (Math.PI * theta) / 180;
    let dist =
      Math.sin(radlat1) * Math.sin(radlat2) +
      Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta); // Haversine formula
    if (dist > 1) {
      dist = 1; // Correct any floating-point precision errors
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

// Finds the closest corner to a given latitude and longitude at a specific zoom level
const getClosestCorner = (
  lat: number,
  lon: number,
  zoom: number,
): { lat_deg: number; lon_deg: number } | null => {
  const tile = deg2num(lat, lon, zoom);
  let shortest = Infinity;
  let closestGeo: { lat_deg: number; lon_deg: number } | null = null;

  // Loop through the adjacent tiles to find the closest corner
  for (let indexX = tile.xtile; indexX <= tile.xtile + 1; indexX++) {
    for (let indexY = tile.ytile; indexY <= tile.ytile + 1; indexY++) {
      const geo = num2deg(indexX, indexY, zoom);
      const distanceInKM = distance(lat, lon, geo.lat_deg, geo.lon_deg, "K");
      if (distanceInKM < shortest) {
        shortest = distanceInKM;
        closestGeo = geo; // Update the closest corner
      }
    }
  }

  return closestGeo;
};

// Approximates the geometry of a set of points by snapping them to the nearest tile corner
export const approximateGeom = (points: string): string => {
  const list = points.split(",");
  let newValues = "";
  const zoom = 19;

  // Loop through each point and snap it to the closest corner
  list.forEach((element) => {
    const lat = parseFloat(element.split(" ")[1]);
    const lon = parseFloat(element.split(" ")[0]);

    const geo = getClosestCorner(lat, lon, zoom);
    if (geo) {
      newValues += geo.lon_deg + " " + geo.lat_deg + ",";
    }
  });

  return newValues.slice(0, -1);
};
