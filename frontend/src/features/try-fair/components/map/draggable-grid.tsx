import { ArrowMoveIcon } from "@/components/ui/icons";
import { num2deg } from "@/utils/geo/geometry-utils";
import { BBOX } from "@/types";
import { LngLatLike, Map } from "maplibre-gl";
import {
  PointerEvent as ReactPointerEvent,
  RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  DEFAULT_SELECTED_GRID,
  SELECTED_GRID_BY_ZOOM,
  SelectedGridSpec,
  TRY_FAIR_RESOLUTION_ZOOM,
  VISIBLE_GRID_COLUMNS,
  VISIBLE_GRID_ROWS,
} from "@/features/try-fair/utils/common";
import { TryFairResolution } from "@/enums/try-fair";

// ── Types ────────────────────────────────────────────────────────────────────

type TileAnchor = { x: number; y: number; z: number };

type DragState = {
  isDragging: boolean;
  startAnchor: TileAnchor | null;
  startTile: { x: number; y: number } | null;
  dragPanWasEnabled: boolean;
};

// ── Pure helpers ─────────────────────────────────────────────────────────────

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(Math.max(v, lo), hi);

const getSelectedGridSpec = (zoom: number): SelectedGridSpec =>
  SELECTED_GRID_BY_ZOOM[zoom] ?? DEFAULT_SELECTED_GRID;

const lngLatToTileCoords = (
  lat_deg: number,
  lon_deg: number,
  zoom: number,
): { xtile: number; ytile: number } => {
  const lat_rad = (lat_deg * Math.PI) / 180;
  const n = Math.pow(2, zoom);
  return {
    xtile: ((lon_deg + 180) / 360) * n,
    ytile: ((1 - Math.asinh(Math.tan(lat_rad)) / Math.PI) / 2) * n,
  };
};

const clampAnchor = (a: TileAnchor): TileAnchor => {
  const selected = getSelectedGridSpec(a.z);
  const max = Math.pow(2, a.z);
  const maxX = Math.max(0, max - selected.columns);
  const maxY = Math.max(0, max - selected.rows);
  return {
    ...a,
    x: clamp(a.x, 0, maxX),
    y: clamp(a.y, 0, maxY),
  };
};

const getCenteredAnchor = (
  center: { lng: number; lat: number },
  zoom: number,
): TileAnchor => {
  const selected = getSelectedGridSpec(zoom);
  const { xtile, ytile } = lngLatToTileCoords(center.lat, center.lng, zoom);
  // Snap to integer tile boundaries so the visual grid always aligns with the
  // bbox that gets sent to the prediction API (which uses getSnappedAnchor).
  return getSnappedAnchor(
    clampAnchor({
      x: xtile - selected.columns / 2,
      y: ytile - selected.rows / 2,
      z: zoom,
    }),
  );
};

const getSelectedGridBBox = (anchor: TileAnchor): BBOX => {
  const selected = getSelectedGridSpec(anchor.z);
  const nw = num2deg(anchor.x, anchor.y, anchor.z);
  const se = num2deg(
    anchor.x + selected.columns,
    anchor.y + selected.rows,
    anchor.z,
  );
  return [nw.lon_deg, se.lat_deg, se.lon_deg, nw.lat_deg];
};

const getSnappedAnchor = (anchor: TileAnchor): TileAnchor =>
  clampAnchor({
    ...anchor,
    x: Math.floor(anchor.x),
    y: Math.floor(anchor.y),
  });

/** Returns the tile zoom for the given resolution, falling back to MID. */
const getTileZoomForResolution = (resolution?: TryFairResolution): number =>
  TRY_FAIR_RESOLUTION_ZOOM[resolution ?? TryFairResolution.MID];

type GridScreenGeometry = {
  verticalLines: { x1: number; y1: number; x2: number; y2: number }[];
  horizontalLines: { x1: number; y1: number; x2: number; y2: number }[];
  topRight: { x: number; y: number };
};

const toPointString = (line: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}): string => `${line.x1},${line.y1} ${line.x2},${line.y2}`;

// ── Component ────────────────────────────────────────────────────────────────

export const TryFairDraggableGrid = ({
  map,
  mapContainerRef,
  onBBoxChange,
  center,
  resolution,
  modelId,
  isPredicting = false,
}: {
  map: Map | null;
  mapContainerRef: RefObject<HTMLDivElement | null>;
  onBBoxChange: (bbox: BBOX, tileZoom: number) => void;
  /** Imagery center from tileJSON — snaps the grid here when it resolves */
  center?: [number, number];
  /** Current resolution selection — triggers a re-center when it changes */
  resolution?: TryFairResolution;
  /** Selected model ID — triggers a re-center when the model changes */
  modelId?: string | null;
  /** When true, grid dragging is disabled */
  isPredicting?: boolean;
}) => {
  const [anchor, setAnchor] = useState<TileAnchor | null>(null);
  const [screenGeometry, setScreenGeometry] =
    useState<GridScreenGeometry | null>(null);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    startAnchor: null,
    startTile: null,
    dragPanWasEnabled: false,
  });
  const handleRef = useRef<HTMLButtonElement | null>(null);
  const previousCenterRef = useRef<[number, number] | null>(null);
  const isUserPositionedRef = useRef(false);
  const pendingPointerRef = useRef<{ x: number; y: number } | null>(null);
  const dragRafRef = useRef<number | null>(null);

  // Initialize / recenter grid from imagery center using the resolution tile zoom.
  useEffect(() => {
    if (!map) return;
    const nextCenter = center
      ? ([center[0], center[1]] as [number, number])
      : null;
    const previousCenter = previousCenterRef.current;
    const centerChanged =
      !!nextCenter &&
      (!previousCenter ||
        previousCenter[0] !== nextCenter[0] ||
        previousCenter[1] !== nextCenter[1]);

    if (!anchor || centerChanged) {
      const target = nextCenter
        ? { lng: nextCenter[0], lat: nextCenter[1] }
        : map.getCenter();
      setAnchor(
        getCenteredAnchor(target, getTileZoomForResolution(resolution)),
      );
      isUserPositionedRef.current = false;
    }

    previousCenterRef.current = nextCenter;
  }, [map, center, anchor]);

  // Update the grid tile zoom when resolution changes, centering on the current map view.
  // The map camera is never touched — only the grid tile structure updates.
  useEffect(() => {
    if (!map || resolution === undefined) return;
    const newTileZoom = TRY_FAIR_RESOLUTION_ZOOM[resolution];
    const center = map.getCenter();
    isUserPositionedRef.current = false;
    setAnchor(
      getCenteredAnchor({ lng: center.lng, lat: center.lat }, newTileZoom),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolution]);

  // Re-center the grid when the model changes.
  useEffect(() => {
    if (!map || !modelId) return;
    isUserPositionedRef.current = false;
    // Clear the remembered imagery center so the new model's center triggers a fresh snap.
    previousCenterRef.current = null;
    setAnchor(
      getCenteredAnchor(map.getCenter(), getTileZoomForResolution(resolution)),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelId]);

  // Initialise the anchor once on map-load if not already set by the imagery-centre effect.
  // The grid is geo-fixed after this: it does NOT retile when the user scrolls/zooms.
  useEffect(() => {
    if (!map) return;
    setAnchor((prev) => {
      if (prev) return prev;
      const target = center
        ? { lng: center[0], lat: center[1] }
        : map.getCenter();
      return getCenteredAnchor(target, getTileZoomForResolution(resolution));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  useEffect(() => {
    if (!anchor) return;
    onBBoxChange(getSelectedGridBBox(getSnappedAnchor(anchor)), anchor.z);
  }, [anchor, onBBoxChange]);

  const syncScreenGeometry = useCallback(() => {
    if (!map || !anchor) return;
    const selected = getSelectedGridSpec(anchor.z);
    const verticalLines: GridScreenGeometry["verticalLines"] = [];
    const horizontalLines: GridScreenGeometry["horizontalLines"] = [];

    // Draw a 4x4 visual grid inside the selected tile bbox using fractional
    // tile coordinates, so we don't add extra tiles outside the selected area.
    for (let column = 0; column <= VISIBLE_GRID_COLUMNS; column++) {
      const x = anchor.x + (column / VISIBLE_GRID_COLUMNS) * selected.columns;
      const top = num2deg(x, anchor.y, anchor.z);
      const bottom = num2deg(x, anchor.y + selected.rows, anchor.z);
      const p1 = map.project({
        lng: top.lon_deg,
        lat: top.lat_deg,
      } as LngLatLike);
      const p2 = map.project({
        lng: bottom.lon_deg,
        lat: bottom.lat_deg,
      } as LngLatLike);
      verticalLines.push({ x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y });
    }

    for (let row = 0; row <= VISIBLE_GRID_ROWS; row++) {
      const y = anchor.y + (row / VISIBLE_GRID_ROWS) * selected.rows;
      const left = num2deg(anchor.x, y, anchor.z);
      const right = num2deg(anchor.x + selected.columns, y, anchor.z);
      const p1 = map.project({
        lng: left.lon_deg,
        lat: left.lat_deg,
      } as LngLatLike);
      const p2 = map.project({
        lng: right.lon_deg,
        lat: right.lat_deg,
      } as LngLatLike);
      horizontalLines.push({ x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y });
    }

    const topRight = verticalLines[VISIBLE_GRID_COLUMNS]
      ? {
          x: verticalLines[VISIBLE_GRID_COLUMNS].x1,
          y: verticalLines[VISIBLE_GRID_COLUMNS].y1,
        }
      : { x: 0, y: 0 };

    const hasInvalidPoint = [...verticalLines, ...horizontalLines].some(
      (line) =>
        [line.x1, line.y1, line.x2, line.y2].some(
          (value) => !Number.isFinite(value),
        ),
    );
    if (hasInvalidPoint) return;

    setScreenGeometry({ verticalLines, horizontalLines, topRight });
  }, [anchor, map]);

  useEffect(() => {
    if (!map || !anchor) return;
    syncScreenGeometry();
    map.on("move", syncScreenGeometry);
    map.on("zoom", syncScreenGeometry);
    const container = mapContainerRef.current;
    let ro: ResizeObserver | null = null;
    if (container && typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(syncScreenGeometry);
      ro.observe(container);
    } else {
      window.addEventListener("resize", syncScreenGeometry);
    }
    return () => {
      map.off("move", syncScreenGeometry);
      map.off("zoom", syncScreenGeometry);
      if (ro) ro.disconnect();
      else window.removeEventListener("resize", syncScreenGeometry);
    };
  }, [anchor, map, mapContainerRef, syncScreenGeometry]);

  useEffect(() => {
    if (
      !dragState.isDragging ||
      !map ||
      !dragState.startAnchor ||
      !dragState.startTile
    )
      return;
    const { startAnchor, startTile } = dragState;

    const updateAnchorFromPointer = (clientX: number, clientY: number) => {
      const container = mapContainerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const lngLat = map.unproject([clientX - rect.left, clientY - rect.top]);
      const { xtile, ytile } = lngLatToTileCoords(
        lngLat.lat,
        lngLat.lng,
        startAnchor.z,
      );
      const dx = xtile - startTile.x;
      const dy = ytile - startTile.y;
      setAnchor(
        clampAnchor({
          x: startAnchor.x + dx,
          y: startAnchor.y + dy,
          z: startAnchor.z,
        }),
      );
    };

    const flushPendingPointer = () => {
      if (!pendingPointerRef.current) return;
      const { x, y } = pendingPointerRef.current;
      pendingPointerRef.current = null;
      updateAnchorFromPointer(x, y);
    };

    const scheduleFrame = () => {
      if (dragRafRef.current !== null) return;
      dragRafRef.current = window.requestAnimationFrame(() => {
        dragRafRef.current = null;
        flushPendingPointer();
        if (pendingPointerRef.current) scheduleFrame();
      });
    };

    const handlePointerMove = (e: PointerEvent) => {
      pendingPointerRef.current = { x: e.clientX, y: e.clientY };
      scheduleFrame();
    };

    const handlePointerUp = () => {
      if (dragRafRef.current !== null) {
        window.cancelAnimationFrame(dragRafRef.current);
        dragRafRef.current = null;
      }
      flushPendingPointer();
      if (
        dragState.dragPanWasEnabled &&
        map.dragPan &&
        !map.dragPan.isEnabled()
      ) {
        map.dragPan.enable();
      }
      // Snap to integer tile boundaries so the visual grid aligns with the
      // bbox reported to the prediction API.
      setAnchor((prev) => (prev ? getSnappedAnchor(prev) : prev));
      setDragState((prev) => ({
        ...prev,
        isDragging: false,
        startAnchor: null,
        startTile: null,
        dragPanWasEnabled: false,
      }));
      handleRef.current?.blur();
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      if (dragRafRef.current !== null) {
        window.cancelAnimationFrame(dragRafRef.current);
        dragRafRef.current = null;
      }
      pendingPointerRef.current = null;
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [dragState, map, mapContainerRef]);

  const handleDragStart = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (!map || !anchor || isPredicting) return;
    e.preventDefault();
    e.stopPropagation();
    const container = mapContainerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const lngLat = map.unproject([e.clientX - rect.left, e.clientY - rect.top]);
    const { xtile, ytile } = lngLatToTileCoords(
      lngLat.lat,
      lngLat.lng,
      anchor.z,
    );
    isUserPositionedRef.current = true;
    const dragPanWasEnabled = map.dragPan ? map.dragPan.isEnabled() : false;
    if (dragPanWasEnabled) map.dragPan.disable();
    setDragState({
      isDragging: true,
      startAnchor: anchor,
      startTile: { x: xtile, y: ytile },
      dragPanWasEnabled,
    });
  };

  if (!screenGeometry) return null;
  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
      <svg className="absolute inset-0 w-full h-full overflow-visible">
        {screenGeometry.verticalLines.map((line, index) => (
          <polyline
            key={`grid-v-${index}`}
            points={toPointString(line)}
            fill="none"
            stroke="#EF4444"
            strokeOpacity={
              index === 0 || index === VISIBLE_GRID_COLUMNS ? 1 : 0.75
            }
            strokeWidth={index === 0 || index === VISIBLE_GRID_COLUMNS ? 2 : 1}
          />
        ))}
        {screenGeometry.horizontalLines.map((line, index) => (
          <polyline
            key={`grid-h-${index}`}
            points={toPointString(line)}
            fill="none"
            stroke="#EF4444"
            strokeOpacity={
              index === 0 || index === VISIBLE_GRID_ROWS ? 1 : 0.75
            }
            strokeWidth={index === 0 || index === VISIBLE_GRID_ROWS ? 2 : 1}
          />
        ))}
      </svg>

      <button
        ref={handleRef}
        type="button"
        onPointerDown={handleDragStart}
        title={isPredicting ? "Grid locked during prediction" : "Move grid"}
        disabled={isPredicting}
        className={`absolute z-20 pointer-events-auto rounded-full bg-white border border-primary p-1.5 shadow-sm ${
          isPredicting
            ? "opacity-40 cursor-not-allowed"
            : dragState.isDragging
              ? "cursor-grabbing"
              : "cursor-grab"
        }`}
        style={{
          left: `${screenGeometry.topRight.x}px`,
          top: `${screenGeometry.topRight.y}px`,
          transform: "translate(-50%, -50%)",
        }}
      >
        <ArrowMoveIcon className="w-4 h-4 text-red-600" />
      </button>
    </div>
  );
};
