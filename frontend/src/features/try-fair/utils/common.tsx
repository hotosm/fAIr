import { TRY_FAIR_PAGE_CONTENT } from "@/constants/ui-contents/try-fair-contents";
import { TryFairMapOutputType, TryFairResolution } from "@/enums/try-fair";
import { PointsIcon } from "@/components/ui/icons/points-icons";
import { ClusterIcon } from "@/components/ui/icons/cluster-icon";
import { PolygonIcon } from "@/components/ui/icons/polygon-icon";
import React from "react";

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
    size: 16,
  },
  {
    value: TryFairResolution.HIGH,
    label: TRY_FAIR_PAGE_CONTENT.sidebar.parameters.resolution.high,
    size: 18,
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
  [TryFairResolution.LOW]: 17,
  [TryFairResolution.MID]: 18,
  [TryFairResolution.HIGH]: 19,
};
