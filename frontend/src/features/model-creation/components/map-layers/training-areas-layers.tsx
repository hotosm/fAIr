import {
  TRAINING_AREAS_AOI_FILL_COLOR,
  TRAINING_AREAS_AOI_FILL_OPACITY,
  TRAINING_AREAS_AOI_OUTLINE_COLOR,
  TRAINING_AREAS_AOI_OUTLINE_WIDTH,
} from "@/config";
import { Feature, GeoJSONType } from "@/types";
import { GeoJSONSource, Map } from "maplibre-gl";
import { useEffect, useMemo } from "react";

export const TrainingAreasLayers = ({
  map,
  features,
  trainingAreasSourceId,
  trainingAreasOutlineLayerId,
  trainingAreasFillLayerId,
}: {
  map: Map | null;
  features?: Feature[];
  trainingAreasOutlineLayerId: string;
  trainingAreasSourceId: string;
  trainingAreasFillLayerId: string;
}) => {
  const geoJsonData = useMemo(
    () => ({
      type: "FeatureCollection",
      features: features,
    }),
    [features],
  );

  useEffect(() => {
    if (!map) return;
    if (!map.getSource(trainingAreasSourceId)) {
      map.addSource(trainingAreasSourceId, {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
    }
    if (!map.getLayer(trainingAreasFillLayerId)) {
      map.addLayer({
        id: trainingAreasFillLayerId,
        type: "fill",
        source: trainingAreasSourceId,
        paint: {
          "fill-color": TRAINING_AREAS_AOI_FILL_COLOR,
          "fill-opacity": TRAINING_AREAS_AOI_FILL_OPACITY,
        },
        layout: { visibility: "visible" },
      });
    }
    if (!map.getLayer(trainingAreasOutlineLayerId)) {
      map.addLayer({
        id: trainingAreasOutlineLayerId,
        type: "line",
        source: trainingAreasSourceId,
        paint: {
          "line-color": TRAINING_AREAS_AOI_OUTLINE_COLOR,
          "line-width": TRAINING_AREAS_AOI_OUTLINE_WIDTH,
        },
        layout: { visibility: "visible" },
      });
    }
  }, [map]);

  useEffect(() => {
    if (!map || !features) return;
    const source = map.getSource(trainingAreasSourceId) as GeoJSONSource;
    if (source) {
      source.setData(geoJsonData as GeoJSONType);
    }
  }, [map, geoJsonData]);

  return null;
};
