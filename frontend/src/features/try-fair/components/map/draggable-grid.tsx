import { RefObject, useEffect, useRef, useState } from "react";
import { Map } from "maplibre-gl";
import { ElipsisIcon, CloudDownloadIcon } from "@/components/ui/icons";
import { DropDown } from "@/components/ui/dropdown";
import { ToolTip } from "@/components/ui/tooltip";
import { geoJSONDowloader } from "@/utils/geo/geo-utils";
import { BBOX } from "@/types";
import { TryFairResolution } from "@/enums/try-fair";
import { TryFairMapOutputType } from "@/enums/try-fair";
import {
  VISIBLE_GRID_COLUMNS,
  VISIBLE_GRID_ROWS,
} from "@/features/try-fair/utils/common";
import { useTileGrid } from "@/features/try-fair/hooks/use-tile-grid";
import { useGridDrag } from "@/features/try-fair/hooks/use-grid-drag";
import {
  useGridScreenGeometry,
  screenLineToPointsAttr,
} from "@/features/try-fair/hooks/use-grid-screen-geometry";
import {
  buildChoropleth,
  toPointCollection,
} from "@/features/try-fair/utils/helpers";

//  Constants

/** Grid line colour  */
const GRID_LINE_COLOR = "#EF4444";

// Types

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
  /** Current predictions — when present, shows the export dropdown. */
  predictions?: GeoJSON.FeatureCollection | null;
  /** Currently selected output type — used to name the export file. */
  outputType?: TryFairMapOutputType;
  /** Bounding box used for the current prediction result. */
  predictionBBox?: BBOX | null;
  /** Grid zoom used for the current prediction result. */
  predictionGridZoom?: number | null;
};

// ── Helpers ──────────────────────────────────────────────────────────────────

const CHOROPLETH_FILL_LAYER_ID = "try-fair-predictions-choropleth-fill";

const getDownloadData = (
  predictions: GeoJSON.FeatureCollection,
  outputType: TryFairMapOutputType,
  predictionBBox?: BBOX | null,
  predictionGridZoom?: number | null,
): GeoJSON.FeatureCollection => {
  if (outputType === TryFairMapOutputType.POINTS) {
    return toPointCollection(predictions);
  }
  if (outputType === TryFairMapOutputType.CLUSTER && predictionBBox) {
    return buildChoropleth(
      predictions,
      predictionBBox,
      predictionGridZoom ?? undefined,
    );
  }
  return predictions;
};

const downloadPredictions = (
  predictions: GeoJSON.FeatureCollection,
  outputType: TryFairMapOutputType,
  predictionBBox?: BBOX | null,
  predictionGridZoom?: number | null,
) => {
  const exportData = getDownloadData(
    predictions,
    outputType,
    predictionBBox,
    predictionGridZoom,
  );
  geoJSONDowloader(exportData, `fair-predictions-${outputType.toLowerCase()}`);
};

type HoverTooltip = {
  x: number;
  y: number;
  count: number;
} | null;

// ── Component ────────────────────────────────────────────────────────────────

export const TryFairDraggableGrid = ({
  map,
  mapContainerRef,
  onBBoxChange,
  center: imageryCenter,
  resolution,
  modelId,
  isPredicting = false,
  predictions,
  outputType,
  predictionBBox,
  predictionGridZoom,
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

  // Hide the export dropdown once the user drags the grid away from the
  // area where the prediction was run.
  const [gridMovedSincePredict, setGridMovedSincePredict] =
    useState<boolean>(false);
  const [hoverTooltip, setHoverTooltip] = useState<HoverTooltip>(null);

  const hasPredictions = !!predictions && predictions.features.length > 0;

  // Reset the "moved" flag when fresh predictions arrive.
  useEffect(() => {
    if (hasPredictions) setGridMovedSincePredict(false);
  }, [hasPredictions]);

  const { isDragging, handlePointerDown } = useGridDrag({
    map,
    mapContainerRef,
    anchor,
    setAnchor,
    disabled: isPredicting,
    onDragStart: () => setGridMovedSincePredict(true),
  });

  //  Screen projection

  const screenGeometry = useGridScreenGeometry({
    map,
    mapContainerRef,
    anchor,
  });

  // Safe predictions ref for the export closure

  const predictionsRef = useRef<GeoJSON.FeatureCollection | null>(predictions);
  predictionsRef.current = predictions;

  //  Render

  if (!screenGeometry) return null;

  const { verticalLines, horizontalLines, exportButtonPosition } =
    screenGeometry;

  // Four corners of the grid boundary for the transparent drag polygon.
  const dragSurfacePoints = [
    `${verticalLines[0].x1},${verticalLines[0].y1}`,
    `${verticalLines[VISIBLE_GRID_COLUMNS].x1},${verticalLines[VISIBLE_GRID_COLUMNS].y1}`,
    `${verticalLines[VISIBLE_GRID_COLUMNS].x2},${verticalLines[VISIBLE_GRID_COLUMNS].y2}`,
    `${verticalLines[0].x2},${verticalLines[0].y2}`,
  ].join(" ");

  const cursorStyle = isPredicting
    ? "cursor-not-allowed"
    : isDragging
      ? "cursor-grabbing"
      : "cursor-grab";

  const showExportDropdown =
    hasPredictions && !gridMovedSincePredict && outputType;
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
          className={`${isPredicting ? "pointer-events-none" : "pointer-events-auto"} ${cursorStyle}`}
          style={{ touchAction: "none" }}
          onPointerDown={handlePointerDown}
          onPointerMove={handleDragSurfacePointerMove}
          onPointerLeave={() => setHoverTooltip(null)}
          onWheel={handleDragSurfaceWheel}
        />

        {/* Vertical grid lines */}
        {verticalLines.map((line, index) => {
          const isBorderLine = index === 0 || index === VISIBLE_GRID_COLUMNS;
          return (
            <polyline
              key={`grid-v-${index}`}
              points={screenLineToPointsAttr(line)}
              fill="none"
              stroke={GRID_LINE_COLOR}
              strokeOpacity={isBorderLine ? 1 : 0.75}
              strokeWidth={isBorderLine ? 2 : 1}
            />
          );
        })}

        {/* Horizontal grid lines */}
        {horizontalLines.map((line, index) => {
          const isBorderLine = index === 0 || index === VISIBLE_GRID_ROWS;
          return (
            <polyline
              key={`grid-h-${index}`}
              points={screenLineToPointsAttr(line)}
              fill="none"
              stroke={GRID_LINE_COLOR}
              strokeOpacity={isBorderLine ? 1 : 0.75}
              strokeWidth={isBorderLine ? 2 : 1}
            />
          );
        })}
      </svg>

      {/* Export dropdown — shown when results exist and grid hasn't moved */}
      {showExportDropdown && (
        <div
          className="absolute z-20 pointer-events-auto"
          style={{
            left: `${exportButtonPosition.x}px`,
            top: `${exportButtonPosition.y}px`,
            transform: "translate(-50%, -50%)",
          }}
        >
          <DropDown
            disableCheveronIcon
            distance={10}
            triggerComponent={
              <button
                type="button"
                className="bg-white p-1.5 rounded-full items-center flex justify-center shadow-sm border border-gray-border"
              >
                <ElipsisIcon className="icon" />
              </button>
            }
          >
            <div className="flex gap-x-2 p-2 items-center bg-white">
              <ToolTip content="Export results">
                <button
                  type="button"
                  onClick={() => {
                    const currentPredictions = predictionsRef.current;
                    if (currentPredictions) {
                      downloadPredictions(
                        currentPredictions,
                        outputType,
                        predictionBBox,
                        predictionGridZoom,
                      );
                    }
                  }}
                  className="bg-off-white h-8 px-2.5 gap-1.5 items-center justify-center flex rounded-md"
                >
                  <CloudDownloadIcon className="icon md:icon-lg" />
                  <span className="text-xs text-dark">Download</span>
                </button>
              </ToolTip>
            </div>
          </DropDown>
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
