import { IconProps } from "@/types";
import React from "react";

export const ParkingIcon: React.FC<IconProps> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="12"
    height="12"
    fill="none"
    {...props}
    viewBox="0 0 12 12"
  >
    <path
      stroke="#fff"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4 2.5v7M4 2.5h2.6a2 2 0 0 1 0 4H4"
    />
  </svg>
);
