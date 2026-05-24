// ── Geometry helpers ──────────────────────────────────────────────────────────

import { BBOX } from "@/types";
import { deg2num, num2deg } from "@/utils/geo/geometry-utils";

/**
 * Returns the centroid of a single exterior ring (array of [lon, lat] positions).
 */
export const ringCentroid = (ring: number[][]): [number, number] => {
  const sumX = ring.reduce((s, c) => s + c[0], 0);
  const sumY = ring.reduce((s, c) => s + c[1], 0);
  return [sumX / ring.length, sumY / ring.length];
};

/**
 * Returns exactly ONE centroid per feature regardless of geometry type.
 * - Point        → the coordinate itself
 * - Polygon      → centroid of the exterior ring
 * - MultiPolygon → centroid computed across ALL sub-polygon exterior rings
 *                  (one representative point for the whole shape)
 */
export const featureCentroid = (
  feature: GeoJSON.Feature,
): [number, number] | null => {
  const geom = feature.geometry;
  if (geom.type === "Point") return geom.coordinates as [number, number];
  if (geom.type === "Polygon") {
    const ring = geom.coordinates[0];
    return ring.length ? ringCentroid(ring) : null;
  }
  if (geom.type === "MultiPolygon") {
    // Flatten exterior rings of all sub-polygons into one pool of coordinates
    const allCoords = geom.coordinates.flatMap((poly) => poly[0]);
    return allCoords.length ? ringCentroid(allCoords) : null;
  }
  return null;
};

export const toPointCollection = (
  fc: GeoJSON.FeatureCollection,
): GeoJSON.FeatureCollection => ({
  type: "FeatureCollection",
  features: fc.features.flatMap((f) => {
    const coords = featureCentroid(f);
    if (!coords) return [];
    return [
      {
        type: "Feature" as const,
        geometry: { type: "Point" as const, coordinates: coords },
        properties: f.properties,
      },
    ];
  }),
});

export const CHOROPLETH_GRID_COLS = 5;
export const CHOROPLETH_GRID_ROWS = 5;

/** Lavender → deep purple ramp (5 buckets, matches design) */
export const CHOROPLETH_COLORS = [
  "#EDE9FE",
  "#C4B5FD",
  "#8B5CF6",
  "#6D28D9",
  "#3B0764",
] as const;

export type ChoroplethBucket = {
  min: number;
  max: number;
  color: string;
  label: string;
};

// ── Choropleth grid spec (mirrors draggable-grid.tsx — must stay in sync) ───

type GridSpec = { columns: number; rows: number };
const DEFAULT_GRID_SPEC: GridSpec = { columns: 2, rows: 2 };
const GRID_SPEC_BY_ZOOM: Record<number, GridSpec> = {
  17: { columns: 3, rows: 3 },
  18: { columns: 2, rows: 2 },
  19: { columns: 3, rows: 3 },
  20: { columns: 3, rows: 3 },
};
const getGridSpec = (zoom: number): GridSpec =>
  GRID_SPEC_BY_ZOOM[zoom] ?? DEFAULT_GRID_SPEC;

/**
 * Divides `bbox` into a grid and counts how many prediction feature centroids
 * fall in each cell.
 *
 * When `gridZoom` is provided the cells are tile-aligned (using the same
 * num2deg / deg2num math as the visual draggable grid), so the choropleth
 * fills overlay exactly on top of the red grid.  Without `gridZoom` it falls
 * back to a simple 5×5 equal-degree division.
 */
export const buildChoropleth = (
  predictions: GeoJSON.FeatureCollection,
  bbox: BBOX,
  gridZoom?: number,
): GeoJSON.FeatureCollection => {
  if (gridZoom !== undefined) {
    return buildTileAlignedChoropleth(predictions, bbox, gridZoom);
  }
  return buildEqualDegreeChoropleth(predictions, bbox);
};

// ── Tile-aligned (primary path) ───────────────────────────────────────────────

const buildTileAlignedChoropleth = (
  predictions: GeoJSON.FeatureCollection,
  bbox: BBOX,
  gridZoom: number,
): GeoJSON.FeatureCollection => {
  // Recover the integer anchor tile from the bbox NW corner.
  // The bbox was computed with num2deg so deg2num should give very nearly
  // integer values — Math.round cleans up any floating-point drift.
  const [west, , , north] = bbox;
  const { xtile, ytile } = deg2num(north, west, gridZoom);
  const anchorX = Math.round(xtile);
  const anchorY = Math.round(ytile);
  const { columns: numCols, rows: numRows } = getGridSpec(gridZoom);

  // Count predictions per tile cell
  const counts: number[][] = Array.from({ length: numRows }, () =>
    Array(numCols).fill(0),
  );
  for (const feature of predictions.features) {
    const centroid = featureCentroid(feature);
    if (!centroid) continue;
    const [cx, cy] = centroid;
    const { xtile: tx, ytile: ty } = deg2num(cy, cx, gridZoom);
    const col = Math.floor(tx - anchorX);
    const row = Math.floor(ty - anchorY);
    if (col >= 0 && col < numCols && row >= 0 && row < numRows) {
      counts[row][col]++;
    }
  }

  // Build one polygon per tile using exact tile-corner coordinates
  const features: GeoJSON.Feature[] = [];
  for (let r = 0; r < numRows; r++) {
    for (let c = 0; c < numCols; c++) {
      const { lon_deg: w, lat_deg: n } = num2deg(
        anchorX + c,
        anchorY + r,
        gridZoom,
      );
      const { lon_deg: e, lat_deg: s } = num2deg(
        anchorX + c + 1,
        anchorY + r + 1,
        gridZoom,
      );
      features.push({
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [w, s],
              [e, s],
              [e, n],
              [w, n],
              [w, s],
            ],
          ],
        },
        properties: { count: counts[r][c] },
      });
    }
  }
  return { type: "FeatureCollection", features };
};

// ── Equal-degree fallback (kept for non-tile-zoom contexts) ───────────────────

const buildEqualDegreeChoropleth = (
  predictions: GeoJSON.FeatureCollection,
  bbox: BBOX,
): GeoJSON.FeatureCollection => {
  const [west, south, east, north] = bbox;
  const cellW = (east - west) / CHOROPLETH_GRID_COLS;
  const cellH = (north - south) / CHOROPLETH_GRID_ROWS;

  const counts: number[][] = Array.from({ length: CHOROPLETH_GRID_ROWS }, () =>
    Array(CHOROPLETH_GRID_COLS).fill(0),
  );

  for (const feature of predictions.features) {
    const centroid = featureCentroid(feature);
    if (!centroid) continue;
    const [cx, cy] = centroid;
    const col = Math.min(
      Math.floor((cx - west) / cellW),
      CHOROPLETH_GRID_COLS - 1,
    );
    const row = Math.min(
      Math.floor((cy - south) / cellH),
      CHOROPLETH_GRID_ROWS - 1,
    );
    if (
      col >= 0 &&
      col < CHOROPLETH_GRID_COLS &&
      row >= 0 &&
      row < CHOROPLETH_GRID_ROWS
    ) {
      counts[row][col]++;
    }
  }

  const features: GeoJSON.Feature[] = [];
  for (let r = 0; r < CHOROPLETH_GRID_ROWS; r++) {
    for (let c = 0; c < CHOROPLETH_GRID_COLS; c++) {
      const w = west + c * cellW;
      const e = west + (c + 1) * cellW;
      const s = south + r * cellH;
      const n = south + (r + 1) * cellH;
      features.push({
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [w, s],
              [e, s],
              [e, n],
              [w, n],
              [w, s],
            ],
          ],
        },
        properties: { count: counts[r][c] },
      });
    }
  }

  return { type: "FeatureCollection", features };
};

/**
 * Computes dynamic legend buckets from the choropleth cells. The range is
 * split into 5 equal-width buckets based on the maximum cell count, so the
 * legend always reflects the actual prediction values.
 */
export const computeChoroplethBuckets = (
  choropleth: GeoJSON.FeatureCollection,
): ChoroplethBucket[] => {
  let maxCount = 0;
  for (const f of choropleth.features) {
    const c = (f.properties?.count as number) ?? 0;
    if (c > maxCount) maxCount = c;
  }

  if (maxCount <= 0) {
    // No predictions — fall back to a stable [1, 2, 3, 4, 5+] scale so the
    // legend still renders something readable.
    return CHOROPLETH_COLORS.map((color, i) => ({
      min: i + 1,
      max: i === CHOROPLETH_COLORS.length - 1 ? Infinity : i + 1,
      color,
      label: i === CHOROPLETH_COLORS.length - 1 ? `${i + 1}+` : `${i + 1}`,
    }));
  }

  const step = Math.max(1, Math.ceil(maxCount / CHOROPLETH_COLORS.length));
  return CHOROPLETH_COLORS.map((color, i) => {
    const min = i * step + 1;
    const max = i === CHOROPLETH_COLORS.length - 1 ? Infinity : (i + 1) * step;
    const label =
      max === Infinity ? `${min}+` : min === max ? `${min}` : `${min}–${max}`; // en-dash
    return { min, max, color, label };
  });
};
