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
