import { Feature } from "./api";
import { GeoJSON } from "geojson";
import { LngLatBoundsLike } from "maplibre-gl";
import { SHOELACE_SELECT_SIZES } from "@/enums";

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

export type TQueryParams = Record<
  string,
  string | number | boolean | undefined
>;

export type TBadgeVariants = "green" | "red" | "yellow" | "blue" | "default";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "tertiary"
  | "default"
  | "dark"
  | "none";

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

export type GeoJSONType = GeoJSON;

export type TModelPredictions = {
  all: Feature[];
  accepted: Feature[];
  rejected: Feature[];
};

export type TFAQs = {
  question: string;
  answer: string;
}[];

export type TNavBarLinks = {
  title: string;
  href: string;
}[];

// Extending with shoelace properties.
export type TCSSWithVars = React.CSSProperties & {
  "--size"?: string;
  "--indent-guide-width"?: string;
};

export type TShoelaceSize = `${SHOELACE_SELECT_SIZES}`;
