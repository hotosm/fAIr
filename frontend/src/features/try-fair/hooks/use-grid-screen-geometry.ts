import { RefObject, useCallback, useEffect, useRef, useState } from "react";
import { Map, LngLatLike } from "maplibre-gl";
import { num2deg } from "@/utils/geo/geometry-utils";
import {
  VISIBLE_GRID_COLUMNS,
  VISIBLE_GRID_ROWS,
} from "@/features/try-fair/utils/common";
import {
  TileAnchor,
  getSelectedGridSpec,
} from "@/features/try-fair/utils/tile-math";

// ── Types ────────────────────────────────────────────────────────────────────

export type ScreenLine = { x1: number; y1: number; x2: number; y2: number };

export type GridScreenGeometry = {
  verticalLines: ScreenLine[];
  horizontalLines: ScreenLine[];
  /** Top-right corner of the grid — used for positioning the export button. */
  exportButtonPosition: { x: number; y: number };
};

type UseGridScreenGeometryOptions = {
  map: Map | null;
  mapContainerRef: RefObject<HTMLDivElement | null>;
  anchor: TileAnchor | null;
};

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Format a line as an SVG polyline `points` attribute value. */
export const screenLineToPointsAttr = (line: ScreenLine): string =>
  `${line.x1},${line.y1} ${line.x2},${line.y2}`;

/** Returns true if any coordinate in the line set is non-finite (NaN / ±Infinity). */
const hasInvalidCoordinates = (lines: ScreenLine[]): boolean =>
  lines.some((line) =>
    [line.x1, line.y1, line.x2, line.y2].some(
      (value) => !Number.isFinite(value),
    ),
  );

// ── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Projects the tile-space grid onto screen pixels via `map.project()`.
 *
 * Performance improvement: map `move`/`zoom` events are throttled via
 * `requestAnimationFrame` so we update at most once per frame instead of
 * on every event (which can fire at 60fps during panning).
 */
export const useGridScreenGeometry = ({
  map,
  mapContainerRef,
  anchor,
}: UseGridScreenGeometryOptions): GridScreenGeometry | null => {
  const [geometry, setGeometry] = useState<GridScreenGeometry | null>(null);
  const rafIdRef = useRef<number | null>(null);

  // ── Projection logic ───────────────────────────────────────────────────

  const projectGridToScreen = useCallback(() => {
    if (!map || !anchor) return;

    const gridSpec = getSelectedGridSpec(anchor.z);
    const verticalLines: ScreenLine[] = [];
    const horizontalLines: ScreenLine[] = [];

    // Vertical lines: one per visible column boundary.
    for (let col = 0; col <= VISIBLE_GRID_COLUMNS; col++) {
      const tileX = anchor.x + (col / VISIBLE_GRID_COLUMNS) * gridSpec.columns;

      const topCorner = num2deg(tileX, anchor.y, anchor.z);
      const bottomCorner = num2deg(tileX, anchor.y + gridSpec.rows, anchor.z);

      const topPixel = map.project({
        lng: topCorner.lon_deg,
        lat: topCorner.lat_deg,
      } as LngLatLike);
      const bottomPixel = map.project({
        lng: bottomCorner.lon_deg,
        lat: bottomCorner.lat_deg,
      } as LngLatLike);

      verticalLines.push({
        x1: topPixel.x,
        y1: topPixel.y,
        x2: bottomPixel.x,
        y2: bottomPixel.y,
      });
    }

    // Horizontal lines: one per visible row boundary.
    for (let row = 0; row <= VISIBLE_GRID_ROWS; row++) {
      const tileY = anchor.y + (row / VISIBLE_GRID_ROWS) * gridSpec.rows;

      const leftCorner = num2deg(anchor.x, tileY, anchor.z);
      const rightCorner = num2deg(anchor.x + gridSpec.columns, tileY, anchor.z);

      const leftPixel = map.project({
        lng: leftCorner.lon_deg,
        lat: leftCorner.lat_deg,
      } as LngLatLike);
      const rightPixel = map.project({
        lng: rightCorner.lon_deg,
        lat: rightCorner.lat_deg,
      } as LngLatLike);

      horizontalLines.push({
        x1: leftPixel.x,
        y1: leftPixel.y,
        x2: rightPixel.x,
        y2: rightPixel.y,
      });
    }

    // Guard against projections that produce NaN (e.g. when the grid is
    // entirely outside the current viewport).
    if (
      hasInvalidCoordinates(verticalLines) ||
      hasInvalidCoordinates(horizontalLines)
    ) {
      return;
    }

    // The export button sits at the top-right corner of the grid.
    const lastVerticalLine = verticalLines[VISIBLE_GRID_COLUMNS];
    const exportButtonPosition = lastVerticalLine
      ? { x: lastVerticalLine.x1, y: lastVerticalLine.y1 }
      : { x: 0, y: 0 };

    setGeometry({ verticalLines, horizontalLines, exportButtonPosition });
  }, [anchor, map]);

  // ── Subscribe to map movements and container resizes ───────────────────

  useEffect(() => {
    if (!map || !anchor) return;

    // Initial projection.
    projectGridToScreen();

    // Throttled handler: instead of re-rendering on every move event, we
    // batch to one update per animation frame.
    const scheduleProjection = () => {
      if (rafIdRef.current !== null) return;
      rafIdRef.current = window.requestAnimationFrame(() => {
        rafIdRef.current = null;
        projectGridToScreen();
      });
    };

    map.on("move", scheduleProjection);
    map.on("zoom", scheduleProjection);

    // Listen for container resizes.
    const container = mapContainerRef.current;
    let resizeObserver: ResizeObserver | null = null;

    if (container && typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(scheduleProjection);
      resizeObserver.observe(container);
    } else {
      window.addEventListener("resize", scheduleProjection);
    }

    return () => {
      map.off("move", scheduleProjection);
      map.off("zoom", scheduleProjection);

      if (rafIdRef.current !== null) {
        window.cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }

      if (resizeObserver) {
        resizeObserver.disconnect();
      } else {
        window.removeEventListener("resize", scheduleProjection);
      }
    };
  }, [anchor, map, mapContainerRef, projectGridToScreen]);

  return geometry;
};
