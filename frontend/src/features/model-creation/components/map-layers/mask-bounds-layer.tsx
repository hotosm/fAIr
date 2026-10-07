import { TRAINING_AREAS_MASK_FILL_COLOR } from "@/config";
import { Feature, GeoJSONType } from "@/types";
import {
  GeoJSONSource,
  LngLatBounds,
  LngLatBoundsLike,
  Map,
} from "maplibre-gl";
import { useEffect, useMemo } from "react";
import { difference } from "@turf/difference";
import { featureCollection } from "@turf/helpers";

export const MaskBoundsLayers = ({
  map,
  OAMBounds,
  mapBounds,
}: {
  map: Map | null;
  features?: Feature[];
  OAMBounds: LngLatBoundsLike;
  mapBounds: LngLatBounds;
}) => {
  const maskBoundsFillLayerId = "mask-layer-fill";
  const maskBoundsSourceId = "mask-source";
  const maskBoundsTextLayerId = "mask-layer-text";

  const [west, south, east, north] = OAMBounds as [
    number,
    number,
    number,
    number,
  ];
  const maskBoundsFeature = useMemo(() => {
    const oamBoundsFeature: Feature = {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [west, south],
            [east, south],
            [east, north],
            [west, north],
            [west, south],
          ],
        ],
      },
      properties: {},
    };

    const mapBoundsFeature: Feature = {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [mapBounds.getWest(), mapBounds.getSouth()],
            [mapBounds.getEast(), mapBounds.getSouth()],
            [mapBounds.getEast(), mapBounds.getNorth()],
            [mapBounds.getWest(), mapBounds.getNorth()],
            [mapBounds.getWest(), mapBounds.getSouth()],
          ],
        ],
      },
      properties: {},
    };
    // @ts-expect-error difference expects a FeatureCollection
    return difference(featureCollection([mapBoundsFeature, oamBoundsFeature]));
  }, [OAMBounds, mapBounds]);

  useEffect(() => {
    if (!map || !map.getStyle()) return;
    if (!map.getSource(maskBoundsSourceId)) {
      map.addSource(maskBoundsSourceId, {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
    }
    if (!map.getLayer(maskBoundsFillLayerId)) {
      map.addLayer({
        id: maskBoundsFillLayerId,
        type: "fill",
        source: maskBoundsSourceId,
        paint: {
          "fill-color": TRAINING_AREAS_MASK_FILL_COLOR,
          "fill-opacity": 0.2,
        },
        layout: { visibility: "visible" },
      });
    }

    if (!map.getLayer(maskBoundsTextLayerId)) {
      map.addLayer({
        id: maskBoundsTextLayerId,
        type: "symbol",
        source: maskBoundsSourceId,
        layout: {
          "text-field": "Please avoid drawing your training area here.",
          "text-size": 14,
          "text-anchor": "center",
          "text-justify": "center",
          "text-font": ["Open Sans Semibold"],
        },
        paint: {
          "text-color": "#000000",
        },
      });
    }
  }, [map]);

  useEffect(() => {
    if (!map || !maskBoundsFeature || !map.getStyle()) return;
    const source = map.getSource(maskBoundsSourceId) as GeoJSONSource;
    if (source) {
      source.setData(maskBoundsFeature as GeoJSONType);
    }
  }, [map, maskBoundsFeature]);

  return null;
};
