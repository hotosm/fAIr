import { IconProps } from "@/types";
import React from "react";

export const DoubleArrowIcon: React.FC<IconProps> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="37"
    height="33"
    viewBox="0 0 37 33"
    fill="none"
    {...props}
  >
    <rect width="37" height="33" rx="16.5" fill="white" fillOpacity="0.16" />
    <path
      d="M18.9375 21.75C18.9375 21.75 24.1875 17.8834 24.1875 16.5C24.1875 15.1165 18.9375 11.25 18.9375 11.25"
      stroke="white"
      strokeWidth="1.3125"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12.8125 21.75C12.8125 21.75 18.0625 17.8834 18.0625 16.5C18.0625 15.1165 12.8125 11.25 12.8125 11.25"
      stroke="white"
      strokeWidth="1.3125"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
