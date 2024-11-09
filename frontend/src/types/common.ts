import { LngLatBoundsLike } from "maplibre-gl";

/* eslint-disable @typescript-eslint/no-empty-object-type */
export interface IconProps extends React.SVGProps<SVGSVGElement> {}

export type ShoelaceSlotProps = {
  slot?: string;
};

export type DateFilter = {
  label: string;
  apiValue: string;
  searchParams: string;
};

export type TQueryParams = Record<string, string | number | boolean>;

export type TBadgeVariants = "green" | "red" | "yellow" | "blue" | "default";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "tertiary"
  | "default"
  | "dark";

export type ButtonSize = "large" | "medium" | "small";

export type TileJSON = {
  bounds: LngLatBoundsLike;
  center: [number, number, number];
  maxzoom: number;
  name: string;
  minzoom: number;
  tilejson: string;
  tiles: string[];
};

export type DialogProps = {
  isOpened: boolean;
  closeDialog: () => void;
};

export type BBOX = [number, number, number, number];
