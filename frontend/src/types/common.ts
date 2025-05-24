import { GeoJSON } from "geojson";
import { LngLatBoundsLike } from "maplibre-gl";
import { SHOELACE_SELECT_SIZES } from "@/enums";
import { SlDropdown as SlDropdownType } from "@shoelace-style/shoelace";

export type { SlDropdownType };

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

export type TFAQs = {
  question: string;
  answer: string;
}[];

export type TNavBarLinks = {
  title: string;
  href: string;
  active: boolean;
}[];

// Extending with shoelace properties.
export type TCSSWithVars = React.CSSProperties & {
  "--size"?: string;
  "--indent-guide-width"?: string;
};

export type TShoelaceSize = `${SHOELACE_SELECT_SIZES}`;

export type TFooterLinks = {
  title: string;
  route: string;
  active: boolean;
  isExternalLink?: boolean;
}[];

export type TProfileNavigationTabs = {
  title: string;
  href: string;
  active: boolean;
}[];
