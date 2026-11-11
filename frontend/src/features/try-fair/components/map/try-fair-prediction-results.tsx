import { useTryFairParams } from "@/features/try-fair/hooks/use-try-fair-params";
import { useAuth } from "@/app/providers/auth-provider";
import { TryFairMapOutputType } from "@/enums/try-fair";
import { BBOX } from "@/types";
import { ExpressionSpecification, Map, MapMouseEvent } from "maplibre-gl";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  buildChoropleth,
  computeChoroplethBuckets,
  toPointCollection,
} from "@/features/try-fair/utils/helpers";
import {
  buildClassColorExpression,
  describePredictedFeature,
  PredictionClassStyle,
} from "@/features/try-fair/utils/prediction-classes";
import {
  PredictionHover,
  PredictionHoverTooltip,
} from "@/features/try-fair/components/map/prediction-hover-tooltip";

const SOURCE_ID = "try-fair-predictions";
const FILL_LAYER = "try-fair-predictions-fill";
const CASING_LAYER = "try-fair-predictions-casing";
const OUTLINE_LAYER = "try-fair-predictions-outline";
const CIRCLE_LAYER = "try-fair-predictions-circle";
const CLUSTER_LAYER = "try-fair-predictions-cluster";
const CLUSTER_COUNT_LAYER = "try-fair-predictions-cluster-count";
const CHOROPLETH_FILL_LAYER = "try-fair-predictions-choropleth-fill";
const CHOROPLETH_OUTLINE_LAYER = "try-fair-predictions-choropleth-outline";
const POINT_SOURCE_ID = `${SOURCE_ID}-points`;

const ALL_LAYER_IDS = [
  FILL_LAYER,
  CASING_LAYER,
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
  if (map.getSource(POINT_SOURCE_ID)) map.removeSource(POINT_SOURCE_ID);
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
  /** When set and `colored`, features are coloured by their predicted class. */
  classStyle?: PredictionClassStyle | null;
  /** Shows feature details on hover regardless of sign-in and mapping mode. */
  alwaysShowFeatureDetails?: boolean;
};

export const TryFairPredictionsLayer = ({
  map,
  predictions,
  predictionBBox,
  predictionGridZoom,
  outputType,
  onChoroplethBucketsChange,
  classStyle,
  alwaysShowFeatureDetails = false,
}: Props) => {
  const { mappingMode } = useTryFairParams();
  const { isAuthenticated } = useAuth();
  const showFeatureDetails =
    alwaysShowFeatureDetails || (isAuthenticated && mappingMode === "advanced");
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

  const [tooltip, setTooltip] = useState<PredictionHover | null>(null);
  // Keep a ref so event handlers always read the latest map without stale closure
  const mapRef = useRef<Map | null>(null);
  mapRef.current = map;

  useEffect(() => {
    if (!map || !map.getStyle()) return;
    removeLayers(map);
    if (!predictions || !predictions.features.length) return;

    // Colour features by their predicted class when a coloured class style is
    // provided; otherwise fall back to the default single colour.
    const polygonColor = classStyle?.colored
      ? buildClassColorExpression(classStyle)
      : "#A243DC";
    const circleColor = classStyle?.colored
      ? buildClassColorExpression(classStyle)
      : "#A147D8";

    // ── Polygon ──────────────────────────────────────────────────────────────
    if (outputType === TryFairMapOutputType.POLYGON) {
      map.addSource(SOURCE_ID, { type: "geojson", data: predictions });
      map.addLayer({
        id: FILL_LAYER,
        type: "fill",
        source: SOURCE_ID,
        paint: { "fill-color": polygonColor, "fill-opacity": 0.3 },
      });
      map.addLayer({
        id: CASING_LAYER,
        type: "line",
        source: SOURCE_ID,
        paint: {
          "line-color": "#ffffff",
          "line-width": 3,
          "line-opacity": 0.9,
        },
      });
      map.addLayer({
        id: OUTLINE_LAYER,
        type: "line",
        source: SOURCE_ID,
        paint: { "line-color": polygonColor, "line-width": 1.5 },
      });

      // ── Points ───────────────────────────────────────────────────────────────
    } else if (outputType === TryFairMapOutputType.POINTS) {
      // Add polygon source + layers first (reuse predictions directly)
      map.addSource(SOURCE_ID, {
        type: "geojson",
        data: predictions,
      });
      map.addLayer({
        id: FILL_LAYER,
        type: "fill",
        source: SOURCE_ID,
        paint: { "fill-color": "#E5CEF2", "fill-opacity": 0.4 },
      });
      map.addLayer({
        id: CASING_LAYER,
        type: "line",
        source: SOURCE_ID,
        paint: {
          "line-color": "#ffffff",
          "line-width": 3,
          "line-opacity": 0.9,
        },
      });
      map.addLayer({
        id: OUTLINE_LAYER,
        type: "line",
        source: SOURCE_ID,
        paint: { "line-color": "#A243DC", "line-width": 1.5 },
      });

      // Add a second source for the point centroids
      if (!map.getSource(POINT_SOURCE_ID)) {
        map.addSource(POINT_SOURCE_ID, {
          type: "geojson",
          data: toPointCollection(predictions),
        });
      }
      map.addLayer({
        id: CIRCLE_LAYER,
        type: "circle",
        source: POINT_SOURCE_ID,
        paint: {
          "circle-radius": 4,
          "circle-color": circleColor,
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 1.5,
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
  }, [
    map,
    predictions,
    predictionBBox,
    outputType,
    choropleth,
    buckets,
    classStyle,
  ]);

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
      setTooltip({
        x: e.point.x,
        y: e.point.y,
        rows: [{ label: "Features detected", value: count.toLocaleString() }],
      });
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

  useEffect(() => {
    const predictionLayer =
      outputType === TryFairMapOutputType.POINTS
        ? CIRCLE_LAYER
        : outputType === TryFairMapOutputType.POLYGON
          ? FILL_LAYER
          : null;
    if (!map || !predictionLayer || !showFeatureDetails || !classStyle) {
      setTooltip(null);
      return;
    }

    const describeFeatureAt = (e: MapMouseEvent) => {
      const feature = map.queryRenderedFeatures(e.point, {
        layers: [predictionLayer],
      })[0];
      const rows = feature
        ? describePredictedFeature(classStyle, feature.properties ?? {})
        : [];
      if (!rows.length) {
        setTooltip(null);
        map.getCanvas().style.cursor = "";
        return;
      }

      map.getCanvas().style.cursor = "pointer";
      setTooltip({ x: e.point.x, y: e.point.y, rows });
    };

    const handleMouseLeave = () => {
      setTooltip(null);
      map.getCanvas().style.cursor = "";
    };

    map.on("mousemove", predictionLayer, describeFeatureAt);
    map.on("mouseleave", predictionLayer, handleMouseLeave);
    map.on("click", describeFeatureAt);

    return () => {
      map.off("mousemove", predictionLayer, describeFeatureAt);
      map.off("mouseleave", predictionLayer, handleMouseLeave);
      map.off("click", describeFeatureAt);
      map.getCanvas().style.cursor = "";
      setTooltip(null);
    };
  }, [map, outputType, showFeatureDetails, classStyle]);

  return tooltip ? <PredictionHoverTooltip hover={tooltip} /> : null;
};
