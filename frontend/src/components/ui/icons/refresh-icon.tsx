import { IconProps } from "@/types";
import React from "react";

export const RefreshIcon: React.FC<IconProps> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="12"
    height="12"
    fill="none"
    viewBox="0 0 12 12"
    {...props}
  >
    <path
      fill="currentColor"
      d="M11 6a5 5 0 0 0-9-3h2.5a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5v-3a.5.5 0 0 1 1 0v1.028A6 6 0 1 1 0 6a.5.5 0 0 1 1 0 5 5 0 0 0 10 0"
    ></path>
  </svg>
);
