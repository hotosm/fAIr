import { IconProps } from "@/types";
import React from "react";

export const PointsIcon: React.FC<IconProps> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="15"
    height="15"
    fill="none"
    {...props}
    viewBox="0 0 15 15"
  >
    <circle cx="7.167" cy="7.167" r="6.667" fill="#687075" opacity="0.4"></circle>
    <circle cx="7.167" cy="7.167" r="6.667" stroke="#687075" strokeLinejoin="round"></circle>
  </svg>
);
