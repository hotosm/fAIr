import { RefObject, useMemo, useState } from "react";
import { Map } from "maplibre-gl";
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

type TryFairDraggableGridProps = {
  map: Map | null;
  mapContainerRef: RefObject<HTMLDivElement | null>;
  onBBoxChange: (bbox: BBOX, tileZoom: number) => void;
  /** Imagery center from tileJSON — snaps the grid here when it resolves. */
  center?: [number, number];
  /** Current resolution selection — triggers a re-center when it changes. */
  resolution?: TryFairResolution;
  /** Selected model ID — triggers a re-center when the model changes. */
  modelId?: string | null;
  /** When true, grid dragging is disabled. */
  isPredicting?: boolean;
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
  count: number;
} | null;

export const TryFairDraggableGrid = ({
  map,
  mapContainerRef,
  onBBoxChange,
  center: imageryCenter,
  resolution,
  modelId,
  isPredicting = false,
  outputType,
}: TryFairDraggableGridProps) => {
  // Grid anchor & bbox management

  const { anchor, setAnchor } = useTileGrid({
    map,
    imageryCenter,
    resolution,
    modelId,
    onBBoxChange,
  });

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

  const dragDisabled = isPredicting || gridCoversScreen;

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
    disabled: isPredicting,
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

  const isChoroplethOutput = outputType === TryFairMapOutputType.CLUSTER;

  const handleDragSurfacePointerMove = (
    e: React.PointerEvent<SVGPolygonElement>,
  ) => {
    if (!map || !isChoroplethOutput) {
      setHoverTooltip(null);
      return;
    }

    const canvasRect = map.getCanvas().getBoundingClientRect();
    const point = {
      x: e.clientX - canvasRect.left,
      y: e.clientY - canvasRect.top,
    };
    const queryPoint: [number, number] = [point.x, point.y];

    const features = map.queryRenderedFeatures(queryPoint, {
      layers: [CHOROPLETH_FILL_LAYER_ID],
    });
    if (!features.length) {
      setHoverTooltip(null);
      return;
    }

    const count = Number(features[0].properties?.count ?? 0);
    setHoverTooltip({ x: point.x, y: point.y, count });
  };

  const handleDragSurfaceWheel = (e: React.WheelEvent<SVGPolygonElement>) => {
    if (!map || isPredicting) return;

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
          onPointerDown={handlePointerDown}
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
                Buildings detected
              </p>
              <p className="text-base font-bold text-purple-700 leading-tight">
                {hoverTooltip.count.toLocaleString()}
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
