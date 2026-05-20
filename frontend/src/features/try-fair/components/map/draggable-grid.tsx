import { ArrowMoveIcon } from "@/components/ui/icons";
import { BBOX } from "@/types";
import { LngLatLike, Map } from "maplibre-gl";
import {
  PointerEvent as ReactPointerEvent,
  RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const GRID_ZOOM = 18;
const GRID_COLUMNS = 5;
const GRID_ROWS = 5;
const GRID_GEOGRAPHIC_AREA_SCALE = 0.09;

const getGridCellTileSpan = (areaScale: number) => {
  if (!Number.isFinite(areaScale) || areaScale <= 0) return 1;
  return Math.sqrt(areaScale);
};

const GRID_CELL_TILE_SPAN = getGridCellTileSpan(GRID_GEOGRAPHIC_AREA_SCALE);

type TileAnchor = { x: number; y: number; z: number };
type DragState = {
  isDragging: boolean;
  startAnchor: TileAnchor | null;
  startTileFrac: { x: number; y: number } | null;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const worldSizeAtZoom = (z: number) => 2 ** z;

const lonToTileX = (lon: number, z: number) =>
  ((lon + 180) / 360) * worldSizeAtZoom(z);

const latToTileY = (lat: number, z: number) => {
  const sinLat = Math.sin((lat * Math.PI) / 180);
  const y = (1 - Math.log((1 + sinLat) / (1 - sinLat)) / (2 * Math.PI)) / 2;
  return y * worldSizeAtZoom(z);
};

const tileToLng = (x: number, z: number) =>
  (x / worldSizeAtZoom(z)) * 360 - 180;

const tileToLat = (y: number, z: number) => {
  const n = Math.PI - (2 * Math.PI * y) / worldSizeAtZoom(z);
  return Math.atan(0.5 * (Math.exp(n) - Math.exp(-n))) * (180 / Math.PI);
};

const getFracTileCoords = (
  lngLat: { lng: number; lat: number },
  z: number,
) => ({
  x: lonToTileX(lngLat.lng, z),
  y: latToTileY(lngLat.lat, z),
});

const getGridBBoxFromAnchor = (anchor: TileAnchor): BBOX => {
  const west = tileToLng(anchor.x, anchor.z);
  const east = tileToLng(
    anchor.x + GRID_COLUMNS * GRID_CELL_TILE_SPAN,
    anchor.z,
  );
  const north = tileToLat(anchor.y, anchor.z);
  const south = tileToLat(anchor.y + GRID_ROWS * GRID_CELL_TILE_SPAN, anchor.z);
  return [west, south, east, north];
};

const clampAnchor = (anchor: TileAnchor): TileAnchor => {
  const maxX = worldSizeAtZoom(anchor.z) - GRID_COLUMNS * GRID_CELL_TILE_SPAN;
  const maxY = worldSizeAtZoom(anchor.z) - GRID_ROWS * GRID_CELL_TILE_SPAN;
  return {
    ...anchor,
    x: clamp(anchor.x, 0, maxX),
    y: clamp(anchor.y, 0, maxY),
  };
};

const getCenteredAnchor = (center: {
  lng: number;
  lat: number;
}): TileAnchor => {
  const tileCoords = getFracTileCoords(center, GRID_ZOOM);
  return clampAnchor({
    x: tileCoords.x - (GRID_COLUMNS * GRID_CELL_TILE_SPAN) / 2,
    y: tileCoords.y - (GRID_ROWS * GRID_CELL_TILE_SPAN) / 2,
    z: GRID_ZOOM,
  });
};

export const TryFairDraggableGrid = ({
  map,
  mapContainerRef,
  onBBoxChange,
}: {
  map: Map | null;
  mapContainerRef: RefObject<HTMLDivElement | null>;
  onBBoxChange: (bbox: BBOX) => void;
}) => {
  const [anchor, setAnchor] = useState<TileAnchor | null>(null);
  const [screenRect, setScreenRect] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    startAnchor: null,
    startTileFrac: null,
  });
  const [hasDragged, setHasDragged] = useState(false);
  const handleRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!map || hasDragged) return;
    const syncToCenter = () => {
      setAnchor(getCenteredAnchor(map.getCenter()));
    };
    syncToCenter();
    map.on("idle", syncToCenter);
    return () => {
      map.off("idle", syncToCenter);
    };
  }, [hasDragged, map]);

  useEffect(() => {
    if (!anchor) return;
    onBBoxChange(getGridBBoxFromAnchor(anchor));
  }, [anchor, onBBoxChange]);

  const syncScreenRect = useCallback(() => {
    if (!map || !anchor) return;
    const [west, south, east, north] = getGridBBoxFromAnchor(anchor);
    const topLeft = map.project({ lng: west, lat: north } as LngLatLike);
    const bottomRight = map.project({ lng: east, lat: south } as LngLatLike);
    const x = Math.min(topLeft.x, bottomRight.x);
    const y = Math.min(topLeft.y, bottomRight.y);
    const width = Math.abs(bottomRight.x - topLeft.x);
    const height = Math.abs(bottomRight.y - topLeft.y);
    if (width <= 0 || height <= 0) return;
    setScreenRect({ x, y, width, height });
  }, [anchor, map]);

  useEffect(() => {
    if (!map || !anchor) return;
    syncScreenRect();
    map.on("move", syncScreenRect);
    map.on("zoom", syncScreenRect);
    const container = mapContainerRef.current;
    let resizeObserver: ResizeObserver | null = null;
    if (container && typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(syncScreenRect);
      resizeObserver.observe(container);
    } else {
      window.addEventListener("resize", syncScreenRect);
    }
    return () => {
      map.off("move", syncScreenRect);
      map.off("zoom", syncScreenRect);
      if (resizeObserver) resizeObserver.disconnect();
      else window.removeEventListener("resize", syncScreenRect);
    };
  }, [anchor, map, mapContainerRef, syncScreenRect]);

  useEffect(() => {
    if (
      !dragState.isDragging ||
      !map ||
      !dragState.startAnchor ||
      !dragState.startTileFrac
    )
      return;
    const { startAnchor, startTileFrac } = dragState;

    const handlePointerMove = (event: PointerEvent) => {
      const container = mapContainerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const lngLat = map.unproject([
        event.clientX - rect.left,
        event.clientY - rect.top,
      ]);
      const currentFrac = getFracTileCoords(lngLat, GRID_ZOOM);
      const tileDeltaX = currentFrac.x - startTileFrac.x;
      const tileDeltaY = currentFrac.y - startTileFrac.y;
      const deltaX =
        Math.round(tileDeltaX / GRID_CELL_TILE_SPAN) * GRID_CELL_TILE_SPAN;
      const deltaY =
        Math.round(tileDeltaY / GRID_CELL_TILE_SPAN) * GRID_CELL_TILE_SPAN;
      setAnchor(
        clampAnchor({
          x: startAnchor.x + deltaX,
          y: startAnchor.y + deltaY,
          z: startAnchor.z,
        }),
      );
    };

    const handlePointerUp = () => {
      setDragState((prev) => ({ ...prev, isDragging: false }));
      handleRef.current?.blur();
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [dragState, map, mapContainerRef]);

  const handleDragStart = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!map || !anchor) return;
    event.preventDefault();
    event.stopPropagation();
    const container = mapContainerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const lngLat = map.unproject([
      event.clientX - rect.left,
      event.clientY - rect.top,
    ]);
    setDragState({
      isDragging: true,
      startAnchor: anchor,
      startTileFrac: getFracTileCoords(lngLat, GRID_ZOOM),
    });
    setHasDragged(true);
  };

  const gridBackgroundWidthSize = useMemo(() => `${100 / GRID_COLUMNS}%`, []);
  const gridBackgroundHeightSize = useMemo(() => `${100 / GRID_ROWS}%`, []);

  if (!screenRect) return null;

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 10 }}
    >
      <div
        className="absolute border-2 border-red-500 rounded-sm shadow-[0_0_0_1px_rgba(239,68,68,0.25)]"
        style={{
          width: `${screenRect.width}px`,
          height: `${screenRect.height}px`,
          left: `${screenRect.x}px`,
          top: `${screenRect.y}px`,
          backgroundImage:
            "linear-gradient(to right, rgba(239,68,68,0.75) 1px, transparent 1px), linear-gradient(to bottom, rgba(239,68,68,0.75) 1px, transparent 1px)",
          backgroundSize: `${gridBackgroundWidthSize} 100%, 100% ${gridBackgroundHeightSize}`,
          backgroundPosition: "-1px -1px",
        }}
      >
        <button
          ref={handleRef}
          type="button"
          onPointerDown={handleDragStart}
          title="Move grid"
          className={`absolute -top-4 -right-4 z-20 pointer-events-auto rounded-full bg-white border border-red-500 p-1.5 shadow-sm ${dragState.isDragging ? "cursor-grabbing" : "cursor-grab"}`}
        >
          <ArrowMoveIcon className="w-4 h-4 text-red-600" />
        </button>
      </div>
    </div>
  );
};
