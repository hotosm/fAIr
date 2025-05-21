import {
  MIN_ZOOM_LEVEL_FOR_TRAINING_AREA_LABELS,
  TRAINING_AREAS_AOI_LABELS_FILL_COLOR,
  TRAINING_AREAS_AOI_LABELS_FILL_OPACITY,
  TRAINING_AREAS_AOI_LABELS_OUTLINE_COLOR,
  TRAINING_AREAS_AOI_LABELS_OUTLINE_WIDTH,
} from "@/config";
import { Feature, GeoJSONType } from "@/types";
import { metersToLngLat } from "@/utils";
import { GeoJSONSource, Map } from "maplibre-gl";
import { useEffect, useMemo } from "react";

/**
 *  Offsets the coordinates of a GeoJSON feature collection by a given distance in meters.
 * The trick is to offset the feature and then save the offset value in the backend. So the background imagery doesn't change.
 * @param features The GeoJSON feature collection to be modified.
 * @param offset The offset in meters to apply to the coordinates.
 * @param lat  The latitude at which the offset is applied.
 * @returns The modified GeoJSON feature collection with coordinates adjusted by the offset.
 */
const offsetGeoJSON = (
  features: Feature[],
  offset: { x: number; y: number },
  lat: number,
): Feature[] => {
  if (!offset.x && !offset.y) return features;

  const [deltaLng, deltaLat] = metersToLngLat(offset.x, offset.y, lat);

  const cloned = JSON.parse(JSON.stringify(features));

  const applyOffset = (coords: any): any => {
    if (typeof coords[0] === "number") {
      return [coords[0] + deltaLng, coords[1] + deltaLat];
    }
    return coords.map(applyOffset);
  };

  return cloned.map((feature: { geometry: { coordinates: any } }) => {
    if (feature.geometry?.coordinates) {
      feature.geometry.coordinates = applyOffset(feature.geometry.coordinates);
    }
    return feature;
  });
};

export const TrainingAreasLabelsLayers = ({
  map,
  features,
  trainingAreasLabelsSourceId,
  trainingAreasLabelsOutlineLayerId,
  trainingAreasLabelsFillLayerId,
  trainingDatasetOffset,
}: {
  map: Map | null;
  features?: Feature[];
  trainingAreasLabelsOutlineLayerId: string;
  trainingAreasLabelsSourceId: string;
  trainingAreasLabelsFillLayerId: string;
  trainingDatasetOffset: { x: number; y: number };
}) => {
  const geoJsonData = useMemo(() => {
    if (!map || !features) return { type: "FeatureCollection", features: [] };
    const lat = map.getCenter().lat;
    const adjusted = offsetGeoJSON(features, trainingDatasetOffset, lat);
    return {
      type: "FeatureCollection",
      features: adjusted,
    };
  }, [map, features, trainingDatasetOffset]);

  useEffect(() => {
    if (!map) return;

    if (!map.getSource(trainingAreasLabelsSourceId)) {
      map.addSource(trainingAreasLabelsSourceId, {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
    }

    if (!map.getLayer(trainingAreasLabelsFillLayerId)) {
      map.addLayer({
        id: trainingAreasLabelsFillLayerId,
        type: "fill",
        source: trainingAreasLabelsSourceId,
        minzoom: MIN_ZOOM_LEVEL_FOR_TRAINING_AREA_LABELS - 2,
        paint: {
          "fill-color": TRAINING_AREAS_AOI_LABELS_FILL_COLOR,
          "fill-opacity": TRAINING_AREAS_AOI_LABELS_FILL_OPACITY,
        },
        layout: { visibility: "visible" },
      });
    }

    if (!map.getLayer(trainingAreasLabelsOutlineLayerId)) {
      map.addLayer({
        id: trainingAreasLabelsOutlineLayerId,
        type: "line",
        source: trainingAreasLabelsSourceId,
        minzoom: MIN_ZOOM_LEVEL_FOR_TRAINING_AREA_LABELS - 2,
        paint: {
          "line-color": TRAINING_AREAS_AOI_LABELS_OUTLINE_COLOR,
          "line-width": TRAINING_AREAS_AOI_LABELS_OUTLINE_WIDTH,
        },
        layout: { visibility: "visible" },
      });
    }
  }, [map]);

  useEffect(() => {
    if (!map || !geoJsonData) return;
    const source = map.getSource(trainingAreasLabelsSourceId) as GeoJSONSource;
    if (source) {
      source.setData(geoJsonData as GeoJSONType);
    }
  }, [map, geoJsonData]);

  return null;
};
