import { TRY_FAIR_PAGE_CONTENT } from "@/constants/ui-contents/try-fair-contents";
import { TryFairMapOutputType, TryFairResolution } from "@/enums/try-fair";
import { PointsIcon } from "@/components/ui/icons/points-icons";
import { ClusterIcon } from "@/components/ui/icons/cluster-icon";
import { PolygonIcon } from "@/components/ui/icons/polygon-icon";
import React from "react";

// This is the default zoom level to start mapping.

export const TRY_FAIR_INITIAL_MAP_ZOOM = 18;

export const RESOLUTIONS: {
  value: TryFairResolution;
  label: string;
  size: number;
}[] = [
  {
    value: TryFairResolution.LOW,
    label: TRY_FAIR_PAGE_CONTENT.sidebar.parameters.resolution.low,
    size: 12,
  },
  {
    value: TryFairResolution.MID,
    label: TRY_FAIR_PAGE_CONTENT.sidebar.parameters.resolution.mid,
    size: 14,
  },
  {
    value: TryFairResolution.HIGH,
    label: TRY_FAIR_PAGE_CONTENT.sidebar.parameters.resolution.high,
    size: 16,
  },
];

export const OUTPUT_TYPES: {
  type: TryFairMapOutputType;
  label: string;
  icon: React.ReactNode;
}[] = [
  {
    type: TryFairMapOutputType.POINTS,
    label: "Points",
    icon: <PointsIcon />,
  },
  {
    type: TryFairMapOutputType.POLYGON,
    label: "Polygon",
    icon: <PolygonIcon />,
  },
  {
    type: TryFairMapOutputType.CLUSTER,
    label: "Cluster",
    icon: <ClusterIcon />,
  },
];

export const TRY_FAIR_RESOLUTION_ZOOM: Record<TryFairResolution, number> = {
  [TryFairResolution.LOW]: TRY_FAIR_INITIAL_MAP_ZOOM,
  [TryFairResolution.MID]: 19,
  [TryFairResolution.HIGH]: 20,
};

// Prediction layer IDs (kept in sync with try-fair-prediction-results.tsx)
export const PREDICTION_LAYER_IDS = [
  "try-fair-predictions-fill",
  "try-fair-predictions-outline",
  "try-fair-predictions-circle",
  "try-fair-predictions-cluster",
  "try-fair-predictions-cluster-count",
  "try-fair-predictions-choropleth-fill",
  "try-fair-predictions-choropleth-outline",
];

// ── Grid constants ───────────────────────────────────────────────────────────

/** Visible draggable grid (what users see). */
export const VISIBLE_GRID_COLUMNS = 4;
export const VISIBLE_GRID_ROWS = 4;

export type SelectedGridSpec = { columns: number; rows: number };

/**
 * Selected tile footprint (what gets sent to prediction), configurable by
 * tile zoom level. The visible grid stays 4x4 and is drawn inside this area.
 */
export const DEFAULT_SELECTED_GRID: SelectedGridSpec = { columns: 2, rows: 2 };
export const SELECTED_GRID_BY_ZOOM: Record<number, SelectedGridSpec> = {
  17: { columns: 2, rows: 2 },
  18: { columns: 2, rows: 2 },
  19: { columns: 3, rows: 3 },
  20: { columns: 3, rows: 3 },
};

export const BASE_GRID_ZOOM = 18;
export const MIN_GRID_ZOOM = BASE_GRID_ZOOM;
export const MAX_GRID_ZOOM = 21;
type GridSpec = { columns: number; rows: number };
const DEFAULT_GRID_SPEC: GridSpec = { columns: 2, rows: 2 };

export const getGridSpec = (zoom: number): GridSpec =>
  SELECTED_GRID_BY_ZOOM[zoom] ?? DEFAULT_GRID_SPEC;
