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
