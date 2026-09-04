/**
 * MapLibre plumbing shared by the imagery/location dialog's two maps —
 * {@link OamImageryMap} and {@link CustomImageryMap}.
 *
 * Everything in here operates imperatively on a MapLibre `Map` — adding
 * sources/layers and previewing rasters. The React components stay declarative
 * and just call these helpers from their effects, so the "what happens when"
 * (components) is separated from the "how" (this file).
 *
 * Layer stacking, bottom → top:
 *   basemap → density grid → count labels → selected-cell highlight → preview
 * The image preview is added last so it sits above the grid.
 */
import maplibregl, { GeoJSONSource, Map as MapLibreMap, PointLike } from "maplibre-gl";
import { FetchSource, PMTiles, Protocol } from "pmtiles";
import { BBOX } from "@/types";
import {
  HOT_IMAGERY_DENSITY_PMTILES_URL,
  HOT_IMAGERY_DENSITY_SOURCE_LAYER,
  MAX_ZOOM_LEVEL,
} from "@/config";
import { getImageryTileUrl, OAMImageryItem } from "@/features/try-fair/api/hot-imagery";

// ── Ids ───────────────────────────────────────────────────────────────────────
// Prefixed so they never collide with the try-fAIr map's own sources/layers.

const SOURCES = {
  basemap: "modal-basemap",
  density: "modal-oam-density",
  cell: "modal-selected-cell",
  imagery: "modal-oam-selected",
} as const;

const LAYERS = {
  basemap: "modal-basemap-layer",
  densityFill: "modal-density-fill",
  densityCount: "modal-density-count",
  cellFill: "modal-selected-cell-fill",
  cellLine: "modal-selected-cell-line",
  imagery: "modal-oam-selected-layer",
} as const;

// ── Styling ───────────────────────────────────────────────────────────────────

// Blue choropleth ramp keyed on each cell's image `count`: pale where sparse,
// deep where dense. Pairs are [count, color], fed to an `interpolate`.
const DENSITY_COLOR_RAMP: (string | number)[] = [
  1,
  "#cbdbe3",
  5,
  "#94b6c7",
  20,
  "#5f93ab",
  50,
  "#3f7d99",
];

const CELL_HIGHLIGHT_COLOR = "#D63F40";

const EMPTY_COLLECTION: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: [],
};

// ── Types ─────────────────────────────────────────────────────────────────────

/**
 * A density grid cell the user selected: its aggregated image extent (`bbox`),
 * image `count`, and the cell polygon `geometry` used to paint the highlight.
 */
export type SelectedCell = {
  bbox: BBOX;
  count: number;
  geometry: GeoJSON.Geometry;
};

/** Properties baked into each density cell by the imagery.hotosm.org generator. */
type DensityCellProps = {
  count?: number;
  bboxW?: number;
  bboxS?: number;
  bboxE?: number;
  bboxN?: number;
};

// ── Map creation ──────────────────────────────────────────────────────────────

// Register the pmtiles:// scheme handler exactly once for the app lifetime.
// A single Protocol.tile serves the archive; it is pre-added only to pin
// no-cache so a re-uploaded file doesn't error on a stale If-Range
// revalidation. Registering per dialog-open (and removing on close) would tear
// the scheme down globally — and churn under React StrictMode — silently
// breaking the vector source.
let pmtilesProtocolRegistered = false;
const registerPmtilesProtocol = () => {
  if (pmtilesProtocolRegistered) return;
  const protocol = new Protocol();
  const src = new FetchSource(HOT_IMAGERY_DENSITY_PMTILES_URL);
  src.chromeWindowsNoCache = true;
  protocol.add(new PMTiles(src));
  maplibregl.addProtocol("pmtiles", protocol.tile);
  pmtilesProtocolRegistered = true;
};

/** OpenFreeMap Positron — a clean, light vector basemap (replaces CARTO raster). */
const POSITRON_STYLE_URL = "https://tiles.openfreemap.org/styles/positron";

/** Create the shared modal map (OpenFreeMap Positron basemap, world view). */
export const createImageryMap = (container: HTMLDivElement): MapLibreMap => {
  registerPmtilesProtocol();
  return new maplibregl.Map({
    container,
    style: POSITRON_STYLE_URL,
    center: [0, 20],
    zoom: 1.4,
    minZoom: 1,
    maxZoom: MAX_ZOOM_LEVEL,
    pitchWithRotate: false,
    attributionControl: false,
  });
};

// ── Density grid + cell highlight ─────────────────────────────────────────────

/**
 * Add the OpenAerialMap density grid and the (initially empty) selected-cell
 * highlight. Call once, after the map's `load` event.
 */
export const addImageryLayers = (map: MapLibreMap): void => {
  map.addSource(SOURCES.density, {
    type: "vector",
    url: `pmtiles://${HOT_IMAGERY_DENSITY_PMTILES_URL}`,
  });
  map.addLayer({
    id: LAYERS.densityFill,
    type: "fill",
    source: SOURCES.density,
    "source-layer": HOT_IMAGERY_DENSITY_SOURCE_LAYER,
    // Only draw populated polygon cells (the archive also carries label points).
    filter: ["all", ["==", ["geometry-type"], "Polygon"], [">", ["get", "count"], 0]],
    paint: {
      "fill-color": ["interpolate", ["linear"], ["get", "count"], ...DENSITY_COLOR_RAMP],
      "fill-opacity": 0.75,
      "fill-outline-color": "#ffffff",
    },
  });

  // Image count per cell. The archive carries a Point label feature per cell
  // (separate from the polygon, so tile clipping can't drift the label onto an
  // edge), which is what we label here.
  map.addLayer({
    id: LAYERS.densityCount,
    type: "symbol",
    source: SOURCES.density,
    "source-layer": HOT_IMAGERY_DENSITY_SOURCE_LAYER,
    filter: ["==", ["geometry-type"], "Point"],
    layout: {
      "text-field": ["to-string", ["get", "count"]],
      "text-font": ["Noto Sans Bold"],
      "text-size": 12,
      "text-allow-overlap": false,
    },
    paint: {
      "text-color": "#1b3a4b",
      "text-halo-color": "#ffffff",
      "text-halo-width": 1.5,
    },
  });

  map.addSource(SOURCES.cell, { type: "geojson", data: EMPTY_COLLECTION });
  map.addLayer({
    id: LAYERS.cellFill,
    type: "fill",
    source: SOURCES.cell,
    paint: { "fill-color": CELL_HIGHLIGHT_COLOR, "fill-opacity": 0.35 },
  });
  map.addLayer({
    id: LAYERS.cellLine,
    type: "line",
    source: SOURCES.cell,
    paint: { "line-color": CELL_HIGHLIGHT_COLOR, "line-width": 1.5 },
  });

  // Pointer cursor over clickable cells.
  map.on("mouseenter", LAYERS.densityFill, () => {
    map.getCanvas().style.cursor = "pointer";
  });
  map.on("mouseleave", LAYERS.densityFill, () => {
    map.getCanvas().style.cursor = "";
  });
};

/**
 * The density cell under a click point, or null if the click missed the grid.
 * `bboxW/S/E/N` (the aggregated image extent) is what the picker searches, not
 * the wider cell square; the cell polygon geometry is carried for the highlight.
 */
export const readCellAt = (map: MapLibreMap, point: PointLike): SelectedCell | null => {
  const hit = map.queryRenderedFeatures(point, {
    layers: [LAYERS.densityFill],
  })[0];
  const p = hit?.properties as DensityCellProps | undefined;
  if (!hit || !p || !p.count || p.bboxW == null) return null;
  return {
    bbox: [p.bboxW, p.bboxS!, p.bboxE!, p.bboxN!],
    count: p.count,
    geometry: hit.geometry,
  };
};

/** Paint (or clear, with null) the red highlight over the selected cell. */
export const highlightCell = (map: MapLibreMap, geometry: GeoJSON.Geometry | null): void => {
  const src = map.getSource(SOURCES.cell) as GeoJSONSource | undefined;
  src?.setData(
    geometry
      ? {
          type: "FeatureCollection",
          features: [{ type: "Feature", properties: {}, geometry }],
        }
      : EMPTY_COLLECTION,
  );
};

// ── Raster previews ───────────────────────────────────────────────────────────

const removeLayerAndSource = (map: MapLibreMap, layerId: string, sourceId: string): void => {
  if (map.getLayer(layerId)) map.removeLayer(layerId);
  if (map.getSource(sourceId)) map.removeSource(sourceId);
};

/** Preview a selected OAM image's raster tiles and frame it. */
export const showImageryPreview = (map: MapLibreMap, item: OAMImageryItem): void => {
  removeLayerAndSource(map, LAYERS.imagery, SOURCES.imagery);
  map.addSource(SOURCES.imagery, {
    type: "raster",
    tiles: [getImageryTileUrl(item.id, item.assetName)],
    tileSize: 256,
    bounds: item.bbox, // don't request tiles outside the image extent
  });
  map.addLayer({ id: LAYERS.imagery, type: "raster", source: SOURCES.imagery });
  map.fitBounds(item.bbox, { padding: 40, maxZoom: 18 });
};

export const clearImageryPreview = (map: MapLibreMap): void =>
  removeLayerAndSource(map, LAYERS.imagery, SOURCES.imagery);
