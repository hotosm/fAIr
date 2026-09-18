import { RefObject, useEffect, useMemo, useState } from "react";
import { Map } from "maplibre-gl";
import useScreenSize from "@/hooks/use-screen-size";
import { BBOX } from "@/types";
import { TryFairResolution } from "@/enums/try-fair";
import { TryFairMapOutputType } from "@/enums/try-fair";
import { useTileGrid } from "@/features/try-fair/hooks/use-tile-grid";
import { useGridDrag } from "@/features/try-fair/hooks/use-grid-drag";
import { useGridVisibility } from "@/features/try-fair/hooks/use-grid-visibility";
import { GridOffScreenNudge } from "@/features/try-fair/components/map/grid-off-screen-nudge";
import { computeCenteredAnchor } from "@/features/try-fair/utils/tile-math";
import {
  useGridScreenGeometry,
  screenLineToPointsAttr,
} from "@/features/try-fair/hooks/use-grid-screen-geometry";

/** Grid line colour  */
const GRID_LINE_COLOR = "#EF4444";

const CHOROPLETH_FILL_LAYER_ID = "try-fair-predictions-choropleth-fill";
const PREDICTION_FILL_LAYER_ID = "try-fair-predictions-fill";
const PREDICTION_CIRCLE_LAYER_ID = "try-fair-predictions-circle";

type TryFairDraggableGridProps = {
  map: Map | null;
  mapContainerRef: RefObject<HTMLDivElement | null>;
  onBBoxChange: (bbox: BBOX, tileZoom: number) => void;
  /** Imagery center from tileJSON — snaps the grid here when it resolves. */
  center?: [number, number];
  /** Current resolution selection — triggers a re-center when it changes. */
  resolution?: TryFairResolution;
  /** When true, grid dragging is disabled. */
  isPredicting?: boolean;
  hasNoResults?: boolean;
  /** Currently selected output type — used to name the export file. */
  outputType?: TryFairMapOutputType;
  /** Bounding box used for the current prediction result. */
  predictionBBox?: BBOX | null;
  /** Grid zoom used for the current prediction result. */
  predictionGridZoom?: number | null;
};

type HoverTooltip = {
  x: number;
  y: number;
  label: string;
  value: string;
} | null;

export const TryFairDraggableGrid = ({
  map,
  mapContainerRef,
  onBBoxChange,
  center: imageryCenter,
  resolution,
  isPredicting = false,
  hasNoResults = false,
  outputType,
}: TryFairDraggableGridProps) => {
  // Grid anchor & bbox management

  const { isSmallViewport } = useScreenSize();
  const [isNoResultsDismissed, setIsNoResultsDismissed] = useState(false);

  const { anchor, setAnchor, tileZoom } = useTileGrid({
    map,
    imageryCenter,
    resolution,
    onBBoxChange,
  });

  useEffect(() => {
    if (hasNoResults) setIsNoResultsDismissed(false);
  }, [hasNoResults]);

  useEffect(() => {
    if (!map || !hasNoResults) return;

    const dismiss = () => setIsNoResultsDismissed(true);
    map.on("click", dismiss);
    map.on("mousedown", dismiss);
    map.on("touchstart", dismiss);
    map.on("zoomstart", dismiss);

    return () => {
      map.off("click", dismiss);
      map.off("mousedown", dismiss);
      map.off("touchstart", dismiss);
      map.off("zoomstart", dismiss);
    };
  }, [hasNoResults, map]);

  useEffect(() => {
    if (!isSmallViewport || !map) return;
    const recenter = (e: { originalEvent?: unknown }) => {
      if (!e.originalEvent) return;
      const { lng, lat } = map.getCenter();
      setAnchor((prev) => {
        const next = computeCenteredAnchor({ lng, lat }, tileZoom);
        return prev && prev.x === next.x && prev.y === next.y ? prev : next;
      });
    };
    map.on("move", recenter);
    return () => {
      map.off("move", recenter);
    };
  }, [isSmallViewport, map, setAnchor, tileZoom]);

  //  Drag interaction

  const [hoverTooltip, setHoverTooltip] = useState<HoverTooltip>(null);

  //  Screen projection

  const screenGeometry = useGridScreenGeometry({
    map,
    mapContainerRef,
    anchor,
  });

  // Disable dragging when the grid covers ≥95% of the viewport height —
  // at that size it blocks the entire map and dragging becomes impractical.
  const gridCoversScreen = useMemo(() => {
    if (!screenGeometry || !mapContainerRef.current) return false;
    const { horizontalLines } = screenGeometry;
    const topY = horizontalLines[0].y1;
    const bottomY = horizontalLines[horizontalLines.length - 1].y1;
    const gridHeight = Math.abs(bottomY - topY);
    const containerHeight = mapContainerRef.current.clientHeight;
    return gridHeight / containerHeight >= 0.95;
  }, [screenGeometry, mapContainerRef]);

  const dragDisabled = isPredicting || gridCoversScreen || isSmallViewport;

  const { isDragging, handlePointerDown } = useGridDrag({
    map,
    mapContainerRef,
    anchor,
    setAnchor,
    disabled: dragDisabled,
  });

  //  Off-screen nudge

  // The grid is the prediction AOI, so it intentionally stays put when the
  // user pans. Detect when it's been left off-screen and offer a one-tap way
  // to bring it to the current view.
  const gridVisibility = useGridVisibility({
    map,
    mapContainerRef,
    anchor,
    disabled: isPredicting || isSmallViewport,
  });

  const handleBringGridToView = () => {
    if (!map || !anchor) return;
    const center = map.getCenter();
    setAnchor(
      computeCenteredAnchor({ lng: center.lng, lat: center.lat }, anchor.z),
    );
  };

  //  Render

  if (!screenGeometry) return null;

  const { verticalLines, horizontalLines } = screenGeometry;
  const gridCenter = {
    x: (verticalLines[0].x1 + verticalLines[verticalLines.length - 1].x1) / 2,
    y:
      (horizontalLines[0].y1 + horizontalLines[horizontalLines.length - 1].y1) /
      2,
  };

  // Four corners of the grid boundary for the transparent drag polygon.
  // The right edge is the last vertical line (count varies by tile zoom).
  const lastVerticalIndex = verticalLines.length - 1;
  const lastHorizontalIndex = horizontalLines.length - 1;
  const rightEdge = verticalLines[lastVerticalIndex];
  const dragSurfacePoints = [
    `${verticalLines[0].x1},${verticalLines[0].y1}`,
    `${rightEdge.x1},${rightEdge.y1}`,
    `${rightEdge.x2},${rightEdge.y2}`,
    `${verticalLines[0].x2},${verticalLines[0].y2}`,
  ].join(" ");

  const cursorStyle = dragDisabled
    ? "cursor-not-allowed"
    : isDragging
      ? "cursor-grabbing"
      : "cursor-grab";

  const handleDragSurfacePointerMove = (
    e: React.PointerEvent<SVGPolygonElement>,
  ) => {
    const predictionLayer =
      outputType === TryFairMapOutputType.CLUSTER
        ? CHOROPLETH_FILL_LAYER_ID
        : outputType === TryFairMapOutputType.POINTS
          ? PREDICTION_CIRCLE_LAYER_ID
          : outputType === TryFairMapOutputType.POLYGON
            ? PREDICTION_FILL_LAYER_ID
            : null;
    if (!map || !predictionLayer) {
      setHoverTooltip(null);
      return;
    }

    const canvasRect = map.getCanvas().getBoundingClientRect();
    const point = {
      x: e.clientX - canvasRect.left,
      y: e.clientY - canvasRect.top,
    };
    const queryPoint: [number, number] = [point.x, point.y];

    const feature = map.queryRenderedFeatures(queryPoint, {
      layers: [predictionLayer],
    });
    if (!feature.length) {
      setHoverTooltip(null);
      return;
    }

    if (outputType === TryFairMapOutputType.CLUSTER) {
      setHoverTooltip({
        x: point.x,
        y: point.y,
        label: "Objects detected",
        value: Number(feature[0].properties?.count ?? 0).toLocaleString(),
      });
      return;
    }

    const score = feature[0].properties?.score;
    if (typeof score !== "number") {
      setHoverTooltip(null);
      return;
    }

    setHoverTooltip({
      x: point.x,
      y: point.y,
      label: "Accuracy",
      value: `${(score * 100).toFixed(1)}%`,
    });
  };

  const handleDragSurfaceWheel = (e: React.WheelEvent<SVGPolygonElement>) => {
    if (!map || isPredicting) return;
    setIsNoResultsDismissed(true);

    // The draggable overlay sits on top of the map and captures wheel/trackpad
    // gestures. Forward zoom intent to the map so users can zoom while hovering
    // inside the grid.
    e.preventDefault();
    e.stopPropagation();

    const canvasRect = map.getCanvas().getBoundingClientRect();
    const point = {
      x: e.clientX - canvasRect.left,
      y: e.clientY - canvasRect.top,
    };

    const zoomDelta = -e.deltaY / 300;
    const nextZoom = map.getZoom() + zoomDelta;

    map.zoomTo(nextZoom, {
      around: map.unproject([point.x, point.y]),
      duration: 0,
    });
  };

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
      <svg className="absolute inset-0 w-full h-full overflow-visible">
        {/* Transparent drag surface covering the entire grid */}
        <polygon
          points={dragSurfacePoints}
          fill="transparent"
          className={`${dragDisabled ? "pointer-events-none" : "pointer-events-auto"} ${cursorStyle}`}
          style={{ touchAction: "none" }}
          onPointerDown={(event) => {
            setIsNoResultsDismissed(true);
            handlePointerDown(event);
          }}
          onPointerMove={handleDragSurfacePointerMove}
          onPointerLeave={() => setHoverTooltip(null)}
          onWheel={handleDragSurfaceWheel}
        />

        {/* Vertical grid lines */}
        {verticalLines.map((line, index) => {
          const isBorderLine = index === 0 || index === lastVerticalIndex;
          return (
            <polyline
              key={`grid-v-${index}`}
              points={screenLineToPointsAttr(line)}
              fill="none"
              stroke={GRID_LINE_COLOR}
              strokeOpacity={isBorderLine ? 1 : 0.75}
              strokeWidth={isBorderLine ? 3 : 1}
            />
          );
        })}

        {/* Horizontal grid lines */}
        {horizontalLines.map((line, index) => {
          const isBorderLine = index === 0 || index === lastHorizontalIndex;
          return (
            <polyline
              key={`grid-h-${index}`}
              points={screenLineToPointsAttr(line)}
              fill="none"
              stroke={GRID_LINE_COLOR}
              strokeOpacity={isBorderLine ? 1 : 0.75}
              strokeWidth={isBorderLine ? 3 : 1}
            />
          );
        })}
      </svg>

      {/* Nudge to bring the grid back when it's been panned off-screen */}
      <GridOffScreenNudge
        visibility={gridVisibility}
        onBringGrid={handleBringGridToView}
      />

      {hasNoResults && !isNoResultsDismissed && (
        <div
          className="absolute z-30 -translate-x-1/2 -translate-y-1/2 rounded-full border border-gray-border bg-white px-3 py-1.5 text-xs font-medium text-dark shadow-md"
          style={{ left: gridCenter.x, top: gridCenter.y }}
        >
          No results returned
        </div>
      )}

      {hoverTooltip ? (
        <div
          className="pointer-events-none absolute z-50"
          style={{ left: hoverTooltip.x, top: hoverTooltip.y }}
        >
          <div
            className="relative"
            style={{ transform: "translate(12px, -50%)" }}
          >
            <div className="bg-white/95 backdrop-blur-sm border border-gray-border rounded-lg shadow-lg px-3 py-2 flex flex-col items-start gap-0.5 min-w-[120px]">
              <p className="text-[10px] font-medium text-grey uppercase tracking-wide leading-none">
                {hoverTooltip.label}
              </p>
              <p className="text-base font-bold text-purple-700 leading-tight">
                {hoverTooltip.value}
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
      ) : null}
    </div>
  );
};
