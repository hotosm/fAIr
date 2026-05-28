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

//  Constants 

/** Grid line colour — extracted so it's easy to theme or adjust. */
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
};

// ── Helpers ──────────────────────────────────────────────────────────────────

const downloadPredictions = (
  predictions: GeoJSON.FeatureCollection,
  outputType: TryFairMapOutputType,
) => {
  geoJSONDowloader(predictions, `fair-predictions-${outputType.toLowerCase()}`);
};

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
  const [gridMovedSincePredict, setGridMovedSincePredict] = useState(false);

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
 
  const  predictionsRef = useRef(predictions);
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

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
      <svg className="absolute inset-0 w-full h-full overflow-visible">
        {/* Transparent drag surface covering the entire grid */}
        <polygon
          points={dragSurfacePoints}
          fill="transparent"
          className={`pointer-events-auto ${cursorStyle}`}
          style={{ touchAction: "none" }}
          onPointerDown={handlePointerDown}
        />

        {/* Vertical grid lines */}
        {verticalLines.map((line, index) => {
          const isBorderLine =
            index === 0 || index === VISIBLE_GRID_COLUMNS;
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
                      downloadPredictions(currentPredictions, outputType);
                    }
                  }}
                  className="bg-off-white w-8 h-8 p-1.5 items-center justify-center flex rounded-md"
                >
                  <CloudDownloadIcon className="icon md:icon-lg" />
                </button>
              </ToolTip>
            </div>
          </DropDown>
        </div>
      )}
    </div>
  );
};
