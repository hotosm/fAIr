

import { IconProps } from "@/types";
import React from "react";

export const FeatureCheckIcon: React.FC<IconProps> = (props) => (
   <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    fill="none"
    {...props}
    viewBox="0 0 16 16"
  >
    <path
      fill="#D63F40"
      d="M8 2a6 6 0 1 1 0 12A6 6 0 0 1 8 2m2.12 4.164L7.25 9.042 5.854 7.646a.5.5 0 1 0-.708.708l1.75 1.75a.5.5 0 0 0 .708 0l3.224-3.234a.5.5 0 0 0-.708-.706"
    ></path>
  </svg>
);
