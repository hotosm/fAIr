import type { ExpressionSpecification, GeoJSONSource, Map } from "maplibre-gl";
import { PREDICTED_LAYER_STATUS_COLORS } from "@/config";
import { PredictedFeatureStatus } from "@/enums";
import { type RefObject, useEffect, useMemo, useState } from "react";
import { FeatureFeedbackPopup } from "@/features/feedback/components/feature-feedback-popup";
import type { FeatureFeedbackState } from "@/features/feedback/hooks/use-feature-feedback";
import {
  buildFeedbackOverlay,
  getFeatureAnchor,
} from "@/features/feedback/utils/feature-feedback";
import { FeatureVerdict } from "@/features/feedback/types";

/** The predictions fill layer drawn by TryFairPredictionsLayer (polygon output). */
const PREDICTIONS_FILL_LAYER = "try-fair-predictions-fill";

/** Pointer travel (px) above which a press counts as a drag, not a click. */
const CLICK_TOLERANCE_PX = 5;

const SOURCE_ID = "try-fair-feature-feedback";

/** Design colours for marked features, shared with the Results card swatches. */
const VALID_COLOR =
  PREDICTED_LAYER_STATUS_COLORS[PredictedFeatureStatus.ACCEPTED];
const INVALID_COLOR =
  PREDICTED_LAYER_STATUS_COLORS[PredictedFeatureStatus.REJECTED];
const FILL_LAYER = `${SOURCE_ID}-fill`;
const LINE_LAYER = `${SOURCE_ID}-line`;

const statusColor = (
  selected: string,
  valid: string,
  invalid: string,
): ExpressionSpecification => [
  "match",
  ["get", "status"],
  FeatureVerdict.VALID,
  valid,
  FeatureVerdict.INVALID,
  invalid,
  selected,
];

const removeOverlay = (map: Map) => {
  if (map.getLayer(LINE_LAYER)) map.removeLayer(LINE_LAYER);
  if (map.getLayer(FILL_LAYER)) map.removeLayer(FILL_LAYER);
  if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
};

type FeatureFeedbackLayerProps = {
  map: Map | null;
  /**
   * Element wrapping the map and its overlays. Clicks are read here rather
   * than via map.on("click") because the draggable grid's SVG drag surface
   * sits over the predictions and swallows the map's own click events.
   */
  containerRef: RefObject<HTMLElement | null>;
  predictions: GeoJSON.FeatureCollection | null;
  feedback: FeatureFeedbackState;
  /** Feedback is only offered while polygons are shown and nothing is running. */
  enabled: boolean;
};

/**
 * Lets the user click a predicted polygon and mark it valid or invalid.
 * Draws the selected (cyan), valid (green) and invalid (red) outlines on top
 * of the predictions and anchors the thumbs popup under the selected feature.
 */
export const FeatureFeedbackLayer = ({
  map,
  containerRef,
  predictions,
  feedback,
  enabled,
}: FeatureFeedbackLayerProps) => {
  const { verdicts, selectedId, isSaving, select, toggleVerdict } = feedback;
  const [popupPoint, setPopupPoint] = useState<{ x: number; y: number } | null>(
    null,
  );

  const overlay = useMemo(
    () =>
      enabled
        ? buildFeedbackOverlay(predictions, verdicts, selectedId)
        : buildFeedbackOverlay(null, {}, null),
    [enabled, predictions, verdicts, selectedId],
  );

  // Draw / update the overlay, keeping it above the prediction layers (which
  // are re-added whenever the predictions change).
  useEffect(() => {
    if (!map || !map.getStyle()) return;

    const source = map.getSource(SOURCE_ID) as GeoJSONSource | undefined;
    if (source) {
      source.setData(overlay);
    } else {
      map.addSource(SOURCE_ID, { type: "geojson", data: overlay });
      map.addLayer({
        id: FILL_LAYER,
        type: "fill",
        source: SOURCE_ID,
        paint: {
          "fill-color": statusColor("#05DEFF", VALID_COLOR, INVALID_COLOR),
          "fill-opacity": 0.25,
        },
      });
      map.addLayer({
        id: LINE_LAYER,
        type: "line",
        source: SOURCE_ID,
        paint: {
          "line-color": statusColor("#06B6D4", VALID_COLOR, INVALID_COLOR),
          "line-width": 2,
        },
      });
    }
    map.moveLayer(FILL_LAYER);
    map.moveLayer(LINE_LAYER);
  }, [map, overlay]);

  useEffect(() => {
    if (!map) return;
    return () => {
      if (map.getStyle()) removeOverlay(map);
    };
  }, [map]);

  // Clicking a prediction selects it; clicking empty map clears selection.
  useEffect(() => {
    const container = containerRef.current;
    if (!map || !container || !enabled) {
      select(null);
      return;
    }

    let pressStart: { x: number; y: number } | null = null;

    // Only presses on the map canvas or the grid's SVG surface count — not
    // map controls, legends, or the feedback popup itself.
    const isMapSurface = (target: EventTarget | null) =>
      target instanceof Element &&
      !target.closest("[data-feature-feedback-popup]") &&
      (target === map.getCanvas() || target instanceof SVGElement);

    const handlePointerDown = (e: PointerEvent) => {
      pressStart = isMapSurface(e.target)
        ? { x: e.clientX, y: e.clientY }
        : null;
    };

    const handleClick = (e: MouseEvent) => {
      const start = pressStart;
      pressStart = null;
      if (!start || !isMapSurface(e.target)) return;
      // Ignore the click that ends a map pan or grid drag.
      const travel = Math.hypot(e.clientX - start.x, e.clientY - start.y);
      if (!(travel <= CLICK_TOLERANCE_PX)) return;

      const rect = map.getCanvas().getBoundingClientRect();
      const point: [number, number] = [
        e.clientX - rect.left,
        e.clientY - rect.top,
      ];
      const hit = map.getLayer(PREDICTIONS_FILL_LAYER)
        ? map.queryRenderedFeatures(point, {
            layers: [PREDICTIONS_FILL_LAYER],
          })[0]
        : undefined;
      select(typeof hit?.id === "number" ? hit.id : null);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") select(null);
    };

    // Capture phase so the grid's stopPropagation on pointerdown can't hide it.
    container.addEventListener("pointerdown", handlePointerDown, true);
    container.addEventListener("click", handleClick, true);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      container.removeEventListener("pointerdown", handlePointerDown, true);
      container.removeEventListener("click", handleClick, true);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [map, containerRef, enabled, select]);

  // Keep the popup pinned under the selected feature while the map moves.
  const anchor = useMemo(
    () =>
      selectedId === null
        ? null
        : getFeatureAnchor(predictions?.features[selectedId]?.geometry),
    [predictions, selectedId],
  );

  useEffect(() => {
    if (!map || !anchor || !enabled) {
      setPopupPoint(null);
      return;
    }
    const update = () => {
      const { x, y } = map.project(anchor);
      setPopupPoint({ x, y });
    };
    update();
    map.on("move", update);
    map.on("resize", update);
    return () => {
      map.off("move", update);
      map.off("resize", update);
    };
  }, [map, anchor, enabled]);

  if (!popupPoint || selectedId === null) return null;

  return (
    <FeatureFeedbackPopup
      x={popupPoint.x}
      y={popupPoint.y}
      verdict={verdicts[selectedId]}
      isPending={isSaving}
      onVerdict={(verdict) => void toggleVerdict(selectedId, verdict)}
    />
  );
};
