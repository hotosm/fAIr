import { useEffect } from "react";
import { GeoJSONSource, Map } from "maplibre-gl";

const AREA_SOURCE_ID = "prediction-status-area-source";
const AREA_LAYER_ID = "prediction-status-area-layer";

const SCAN_SOURCE_ID = "prediction-status-scan-source";
const SCAN_LAYER_ID = "prediction-status-scan-layer";

type PredictionStatusLayerProps = {
  map: Map | null;
  isPredicting: boolean;
  bbox?: [number, number, number, number] | null;
};

const bboxToPolygon = (bbox: [number, number, number, number]) => ({
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {},
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [bbox[0], bbox[1]],
            [bbox[2], bbox[1]],
            [bbox[2], bbox[3]],
            [bbox[0], bbox[3]],
            [bbox[0], bbox[1]],
          ],
        ],
      },
    },
  ],
});

const createScanBand = (
  bbox: [number, number, number, number],
  progress: number,
) => {
  const [minX, minY, maxX, maxY] = bbox;

  const height = maxY - minY;

  const bandHeight = height * 0.15;

  const centerY = maxY - bandHeight - progress * (height - bandHeight * 2);

  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {},
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [minX, centerY - bandHeight],
              [maxX, centerY - bandHeight],
              [maxX, centerY + bandHeight],
              [minX, centerY + bandHeight],
              [minX, centerY - bandHeight],
            ],
          ],
        },
      },
    ],
  };
};

export const PredictionStatusLayer = ({
  map,
  isPredicting,
  bbox,
}: PredictionStatusLayerProps) => {
  useEffect(() => {
    if (!map || !map.getStyle()) return;

    if (!map.getSource(AREA_SOURCE_ID)) {
      map.addSource(AREA_SOURCE_ID, {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
      });
    }

    if (!map.getSource(SCAN_SOURCE_ID)) {
      map.addSource(SCAN_SOURCE_ID, {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
      });
    }

    if (!map.getLayer(AREA_LAYER_ID)) {
      map.addLayer({
        id: AREA_LAYER_ID,
        type: "fill",
        source: AREA_SOURCE_ID,
        paint: {
          "fill-color": "#000000",
          "fill-opacity": 0.18,
        },
      });
    }

    if (!map.getLayer(SCAN_LAYER_ID)) {
      map.addLayer({
        id: SCAN_LAYER_ID,
        type: "fill",
        source: SCAN_SOURCE_ID,
        paint: {
          "fill-color": "#ffffff",
          "fill-opacity": 0.25,
        },
      });
    }

    map.moveLayer(AREA_LAYER_ID);
    map.moveLayer(SCAN_LAYER_ID);

    return () => {
      if (map.getLayer(SCAN_LAYER_ID)) {
        map.removeLayer(SCAN_LAYER_ID);
      }

      if (map.getLayer(AREA_LAYER_ID)) {
        map.removeLayer(AREA_LAYER_ID);
      }

      if (map.getSource(SCAN_SOURCE_ID)) {
        map.removeSource(SCAN_SOURCE_ID);
      }

      if (map.getSource(AREA_SOURCE_ID)) {
        map.removeSource(AREA_SOURCE_ID);
      }
    };
  }, [map]);

  useEffect(() => {
    if (!map) return;

    const areaSource = map.getSource(AREA_SOURCE_ID) as
      | GeoJSONSource
      | undefined;

    if (!areaSource) return;

    if (isPredicting && bbox) {
      // @ts-ignore
      areaSource.setData(bboxToPolygon(bbox));
    } else {
      areaSource.setData({
        type: "FeatureCollection",
        features: [],
      });
    }
  }, [map, bbox, isPredicting]);

  useEffect(() => {
    if (!map || !bbox || !isPredicting) return;

    const scanSource = map.getSource(SCAN_SOURCE_ID) as
      | GeoJSONSource
      | undefined;

    if (!scanSource) return;

    let progress = 0;

    const interval = window.setInterval(() => {
      progress += 0.01;

      if (progress > 1) {
        progress = 0;
      }

      // @ts-ignore
      scanSource.setData(
        // @ts-ignore
        createScanBand(bbox, progress),
      );
    }, 30);

    return () => {
      window.clearInterval(interval);

      scanSource.setData({
        type: "FeatureCollection",
        features: [],
      });
    };
  }, [map, bbox, isPredicting]);

  return null;
};
