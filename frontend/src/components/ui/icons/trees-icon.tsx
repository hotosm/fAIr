import { IconProps } from "@/types";
import React from "react";

export const TreesIcon: React.FC<IconProps> = (props) => (
   <svg
    xmlns="http://www.w3.org/2000/svg"
    width="12"
    height="12"
    {...props}
    fill="none"
    viewBox="0 0 12 12"
  >
    <path
      fill="#fff"
      d="M6 .626c.731 0 1.364.418 1.673 1.028A1.875 1.875 0 0 1 9.828 3.92a2.123 2.123 0 0 1-.478 3.87A1.89 1.89 0 0 1 7.5 9.376H6.374v-1.72l1.14-1.14a.376.376 0 0 0-.53-.532l-.61.61V4.5a.375.375 0 1 0-.75 0v1.095l-.61-.61a.376.376 0 0 0-.53.53l1.14 1.14v2.721H4.5A1.89 1.89 0 0 1 2.65 7.79a2.126 2.126 0 0 1-.478-3.87 1.875 1.875 0 0 1 2.155-2.266C4.637 1.044 5.27.626 6 .626M6.375 10.625H7a.375.375 0 0 1 0 .75H5a.375.375 0 0 1 0-.75h.625V9.376h.75z"
    ></path>
  </svg>
);
