import { TryFairMapOutputType } from "@/enums/try-fair";
import { BBOX } from "@/types";
import { ExpressionSpecification, Map } from "maplibre-gl";
import { useEffect, useMemo } from "react";
import {
  buildChoropleth,
  computeChoroplethBuckets,
  toPointCollection,
} from "@/features/try-fair/utils/helpers";

// ── Layer / source IDs    

const SOURCE_ID = "try-fair-predictions";
const FILL_LAYER = "try-fair-predictions-fill";
const OUTLINE_LAYER = "try-fair-predictions-outline";
const CIRCLE_LAYER = "try-fair-predictions-circle";
const CLUSTER_LAYER = "try-fair-predictions-cluster";
const CLUSTER_COUNT_LAYER = "try-fair-predictions-cluster-count";
const CHOROPLETH_FILL_LAYER = "try-fair-predictions-choropleth-fill";
const CHOROPLETH_OUTLINE_LAYER = "try-fair-predictions-choropleth-outline";

const ALL_LAYER_IDS = [
  FILL_LAYER,
  OUTLINE_LAYER,
  CIRCLE_LAYER,
  CLUSTER_LAYER,
  CLUSTER_COUNT_LAYER,
  CHOROPLETH_FILL_LAYER,
  CHOROPLETH_OUTLINE_LAYER,
];


const removeLayers = (map: Map) => {
  ALL_LAYER_IDS.forEach((id) => {
    if (map.getLayer(id)) map.removeLayer(id);
  });
  if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
};

// ── Component ─────────────────────────────────────────────────────────────────

type Props = {
  map: Map | null;
  predictions: GeoJSON.FeatureCollection | null;
  predictionBBox: BBOX | null;
  predictionGridZoom?: number;
  outputType: TryFairMapOutputType;
  onChoroplethBucketsChange?: (
    buckets: ReturnType<typeof computeChoroplethBuckets> | null,
  ) => void;
};

export const TryFairPredictionsLayer = ({
  map,
  predictions,
  predictionBBox,
  predictionGridZoom,
  outputType,
  onChoroplethBucketsChange,
}: Props) => {
  const { choropleth, buckets } = useMemo(() => {
    if (
      outputType !== TryFairMapOutputType.CLUSTER ||
      !predictions ||
      !predictionBBox
    ) {
      return { choropleth: null, buckets: null };
    }
    const fc = buildChoropleth(predictions, predictionBBox, predictionGridZoom ?? undefined);
    return { choropleth: fc, buckets: computeChoroplethBuckets(fc) };
  }, [outputType, predictions, predictionBBox, predictionGridZoom]);

  // Push buckets up to the parent for the legend
  useEffect(() => {
    onChoroplethBucketsChange?.(buckets);
  }, [buckets, onChoroplethBucketsChange]);

  useEffect(() => {
    if (!map || !map.getStyle()) return;
    removeLayers(map);
    if (!predictions || !predictions.features.length) return;

    // ── Polygon ──────────────────────────────────────────────────────────────
    if (outputType === TryFairMapOutputType.POLYGON) {
      map.addSource(SOURCE_ID, { type: "geojson", data: predictions });
      map.addLayer({
        id: FILL_LAYER,
        type: "fill",
        source: SOURCE_ID,
        paint: { "fill-color": "#A243DC", "fill-opacity": 0.45 },
      });
      map.addLayer({
        id: OUTLINE_LAYER,
        type: "line",
        source: SOURCE_ID,
        paint: { "line-color": "#A243DC", "line-width": 1.5 },
      });

    // ── Points ───────────────────────────────────────────────────────────────
    } else if (outputType === TryFairMapOutputType.POINTS) {
      map.addSource(SOURCE_ID, {
        type: "geojson",
        data: toPointCollection(predictions),
      });
      map.addLayer({
        id: CIRCLE_LAYER,
        type: "circle",
        source: SOURCE_ID,
        paint: {
          "circle-radius": 4,
          "circle-color": "#A147D8",
          "circle-stroke-color": "#A147D8",
          "circle-stroke-width": 1,
        },
      });

    // ── Choropleth ───────────────────────────────────────────────────────────
    } else if (outputType === TryFairMapOutputType.CLUSTER) {
      if (!choropleth || !buckets) return;

      map.addSource(SOURCE_ID, { type: "geojson", data: choropleth });

      // Build a dynamic step expression: stops are each bucket's `min` value
      // paired with that bucket's colour. Values below the first stop fall
      // through to the default (transparent — i.e. cells with 0 predictions).
      const stops = buckets.flatMap((b) => [b.min, b.color]);

      map.addLayer({
        id: CHOROPLETH_FILL_LAYER,
        type: "fill",
        source: SOURCE_ID,
        paint: {
          "fill-color": [
            "step",
            ["get", "count"],
            "rgba(0,0,0,0)",
            ...stops,
          ] as ExpressionSpecification,
          "fill-opacity": 0.75,
        },
      });

      // Subtle grid outline so cells are visible even on empty ones
      map.addLayer({
        id: CHOROPLETH_OUTLINE_LAYER,
        type: "line",
        source: SOURCE_ID,
        paint: {
          "line-color": "#7C3AED",
          "line-width": 0.5,
          "line-opacity": 0.4,
        },
      });
    }

    return () => {
      if (map.getStyle()) removeLayers(map);
    };
  }, [map, predictions, predictionBBox, outputType, choropleth, buckets]);

  return null;
};
