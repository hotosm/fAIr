import { num2deg } from "@/utils/geo/geometry-utils";
import { BBOX } from "@/types";
import {
  DEFAULT_SELECTED_GRID,
  SelectedGridSpec,
  TRY_FAIR_RESOLUTION_ZOOM,
} from "@/features/try-fair/utils/common";
import { TryFairResolution } from "@/enums/try-fair";

// ── Types ────────────────────────────────────────────────────────────────────

/** A tile-space position: integer/fractional x/y at a given tile zoom level. */
export type TileAnchor = { x: number; y: number; z: number };

// ── Pure helpers ─────────────────────────────────────────────────────────────

/** Clamp `value` to the range [`min`, `max`]. */
export const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

/**
 * The selected grid footprint (columns × rows sent to the prediction API) is a
 * constant N×N tile block. Its cell count is independent of zoom — only its
 * on-screen size changes with the tile zoom.
 */
export const getSelectedGridSpec = (): SelectedGridSpec => DEFAULT_SELECTED_GRID;

/**
 * Convert a geographic lng/lat to fractional tile coordinates at `tileZoom`.
 *
 * Unlike `deg2num` in geometry-utils (which floors to integers), this returns
 * the raw fractional position so the grid can be positioned precisely.
 */
export const lngLatToTileCoords = (
  latitudeDeg: number,
  longitudeDeg: number,
  tileZoom: number,
): { tileX: number; tileY: number } => {
  const latitudeRad = (latitudeDeg * Math.PI) / 180;
  const tileCount = Math.pow(2, tileZoom);
  return {
    tileX: ((longitudeDeg + 180) / 360) * tileCount,
    tileY: ((1 - Math.asinh(Math.tan(latitudeRad)) / Math.PI) / 2) * tileCount,
  };
};

/**
 * Clamp an anchor so the selected grid stays within the world tile boundaries.
 *
 * At zoom z, valid tile indices are [0, 2^z). The selected grid occupies
 * `columns × rows` tiles, so the anchor must stay within
 * [0, 2^z − columns] × [0, 2^z − rows].
 */
export const clampAnchorToWorldBounds = (anchor: TileAnchor): TileAnchor => {
  const gridSpec = getSelectedGridSpec();
  const maxTileIndex = Math.pow(2, anchor.z);
  const maxAnchorX = Math.max(0, maxTileIndex - gridSpec.columns);
  const maxAnchorY = Math.max(0, maxTileIndex - gridSpec.rows);
  return {
    ...anchor,
    x: clamp(anchor.x, 0, maxAnchorX),
    y: clamp(anchor.y, 0, maxAnchorY),
  };
};

/**
 * Snap anchor x/y to the *nearest* integer tile boundary.
 *
 * Using round (rather than floor) means the grid follows the drag naturally:
 * once the user has dragged more than halfway toward the next tile it snaps
 * forward, instead of always jumping back toward the top-left (NW) tile.
 * This aligns the visual grid with the bbox sent to the prediction API.
 */
export const snapAnchorToTileBoundary = (anchor: TileAnchor): TileAnchor =>
  clampAnchorToWorldBounds({
    ...anchor,
    x: Math.round(anchor.x),
    y: Math.round(anchor.y),
  });

/**
 * Compute an anchor that centers the selected grid around the given lng/lat.
 * The result is snapped to integer tile boundaries.
 */
export const computeCenteredAnchor = (
  center: { lng: number; lat: number },
  tileZoom: number,
): TileAnchor => {
  const gridSpec = getSelectedGridSpec();
  const { tileX, tileY } = lngLatToTileCoords(center.lat, center.lng, tileZoom);

  return snapAnchorToTileBoundary(
    clampAnchorToWorldBounds({
      x: tileX - gridSpec.columns / 2,
      y: tileY - gridSpec.rows / 2,
      z: tileZoom,
    }),
  );
};

/**
 * Compute the [west, south, east, north] bounding box for the selected grid
 * area starting at `anchor`.
 */
export const computeGridBBox = (anchor: TileAnchor): BBOX => {
  const gridSpec = getSelectedGridSpec();
  const northWest = num2deg(anchor.x, anchor.y, anchor.z);
  const southEast = num2deg(
    anchor.x + gridSpec.columns,
    anchor.y + gridSpec.rows,
    anchor.z,
  );
  return [
    northWest.lon_deg,
    southEast.lat_deg,
    southEast.lon_deg,
    northWest.lat_deg,
  ];
};

/** Map a resolution enum to its corresponding tile zoom level. Defaults to MID. */
export const getTileZoomForResolution = (
  resolution?: TryFairResolution,
): number => TRY_FAIR_RESOLUTION_ZOOM[resolution ?? TryFairResolution.MID];
