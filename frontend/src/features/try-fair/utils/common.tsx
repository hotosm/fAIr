import { TRY_FAIR_PAGE_CONTENT } from "@/constants/ui-contents/try-fair-contents";
import { TryFairMapOutputType, TryFairResolution } from "@/enums/try-fair";
import { PointsIcon } from "@/components/ui/icons/points-icons";
import { ClusterIcon } from "@/components/ui/icons/cluster-icon";
import { PolygonIcon } from "@/components/ui/icons/polygon-icon";
import { ENVS } from "@/config/env";
import React from "react";

// This is the default zoom level to start mapping.

export const TRY_FAIR_INITIAL_MAP_ZOOM = 18;

export const FALLBACK_FAIR_IMAGERY =
  "https://tiles.openaerialmap.org/62d85d11d8499800053796c1/0/62d85d11d8499800053796c2/{z}/{x}/{y}";
export const FALLBACK_FAIR_IMAGERY_CENTER: [number, number] = [
  85.5228, 27.6337,
];
export const DEFAULT_FAIR_IMAGERY_CENTER: [number, number] = [
  -13.237922723117881, 8.474166946427818,
];
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
  [TryFairResolution.LOW]: 18,
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

export type SelectedGridSpec = { columns: number; rows: number };

/**
 * The draggable grid is a fixed N×N block of tiles. The cell COUNT never
 * changes — instead the on-screen size of the grid changes with the selected
 * resolution's tile zoom: higher resolution → finer/smaller tiles → the grid
 * (and its tile boundaries) shrinks; lower resolution → larger tiles → it
 * grows. The map is never zoomed for this. This same N×N tile block is exactly
 * what gets sent to the prediction backend.
 *
 * Controlled by the VITE_FAIR_GRID_SIZE environment variable (must be a
 * positive integer). Defaults to 5 if the variable is absent or invalid.
 */
const _rawGridSize = parseInt(ENVS.FAIR_GRID_SIZE ?? "");
export const SELECTED_GRID_SIZE = _rawGridSize > 0 ? _rawGridSize : 5;

export const DEFAULT_SELECTED_GRID: SelectedGridSpec = {
  columns: SELECTED_GRID_SIZE,
  rows: SELECTED_GRID_SIZE,
};

/** The grid footprint is a constant size, independent of zoom/resolution. */
export const getGridSpec = (): SelectedGridSpec => DEFAULT_SELECTED_GRID;
