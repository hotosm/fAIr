import { IconProps } from "@/types";
import * as React from "react";

export const DurationIcon: React.FC<IconProps> = (props) => (
   <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    {...props}
    height="20"
    fill="none"
    viewBox="0 0 20 20"
  >
    <path
      fill="#2C3038"
      d="M10 2a8 8 0 1 1 0 16 8 8 0 0 1 0-16m0 1a7 7 0 1 0 0 14 7 7 0 0 0 0-14m-.5 2a.5.5 0 0 1 .492.41L10 5.5V10h2.5a.5.5 0 0 1 .09.992L12.5 11h-3a.5.5 0 0 1-.492-.41L9 10.5v-5a.5.5 0 0 1 .5-.5"
    ></path>
  </svg>
);

