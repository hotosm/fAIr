import { TryFairMapOutputType } from "@/enums/try-fair";
import { BBOX } from "@/types";
import { ExpressionSpecification, Map, MapMouseEvent } from "maplibre-gl";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  buildChoropleth,
  computeChoroplethBuckets,
  toPointCollection,
} from "@/features/try-fair/utils/helpers";

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

type HoverTooltip = {
  x: number;
  y: number;
  count: number;
} | null;

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
    const fc = buildChoropleth(
      predictions,
      predictionBBox,
      predictionGridZoom ?? undefined,
    );
    return { choropleth: fc, buckets: computeChoroplethBuckets(fc) };
  }, [outputType, predictions, predictionBBox, predictionGridZoom]);

  // Push buckets up to the parent for the legend
  useEffect(() => {
    onChoroplethBucketsChange?.(buckets);
  }, [buckets, onChoroplethBucketsChange]);

  const [tooltip, setTooltip] = useState<HoverTooltip>(null);
  // Keep a ref so event handlers always read the latest map without stale closure
  const mapRef = useRef<Map | null>(null);
  mapRef.current = map;

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
        paint: { "fill-color": "#A243DC", "fill-opacity": 0.5 },
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

  // ── Choropleth hover interactions ──────────────────────────────────────────
  useEffect(() => {
    if (!map || outputType !== TryFairMapOutputType.CLUSTER) {
      setTooltip(null);
      return;
    }

    const handleMouseMove = (e: MapMouseEvent) => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: [CHOROPLETH_FILL_LAYER],
      });
      if (!features.length) {
        setTooltip(null);
        map.getCanvas().style.cursor = "";
        return;
      }
      const count = (features[0].properties?.count as number) ?? 0;
      map.getCanvas().style.cursor = "pointer";
      setTooltip({ x: e.point.x, y: e.point.y, count });
    };

    const handleMouseLeave = () => {
      setTooltip(null);
      map.getCanvas().style.cursor = "";
    };

    map.on("mousemove", CHOROPLETH_FILL_LAYER, handleMouseMove);
    map.on("mouseleave", CHOROPLETH_FILL_LAYER, handleMouseLeave);

    return () => {
      map.off("mousemove", CHOROPLETH_FILL_LAYER, handleMouseMove);
      map.off("mouseleave", CHOROPLETH_FILL_LAYER, handleMouseLeave);
      map.getCanvas().style.cursor = "";
      setTooltip(null);
    };
  }, [map, outputType]);

  if (!tooltip) return null;

  return (
    <div
      className="pointer-events-none absolute z-50"
      style={{ left: tooltip.x, top: tooltip.y }}
    >
      {/* Offset so the tooltip doesn't sit directly under the cursor */}
      <div className="relative" style={{ transform: "translate(12px, -50%)" }}>
        <div className="bg-white/95 backdrop-blur-sm border border-gray-border rounded-lg shadow-lg px-3 py-2 flex flex-col items-start gap-0.5 min-w-[120px]">
          <p className="text-[10px] font-medium text-grey uppercase tracking-wide leading-none">
            Buildings detected
          </p>
          <p className="text-base font-bold text-purple-700 leading-tight">
            {tooltip.count.toLocaleString()}
          </p>
        </div>
        <div
          className="absolute top-1/2 -left-[6px] -translate-y-1/2 w-0 h-0"
          style={{
            borderTop: "6px solid transparent",
            borderBottom: "6px solid transparent",
            borderRight: "6px solid white",
          }}
        />
      </div>
    </div>
  );
};
