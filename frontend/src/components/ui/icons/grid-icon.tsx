import { IconProps } from "@/types";
import React from "react";

export const GridIcon: React.FC<IconProps> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="13"
    height="13"
    fill="none"
    {...props}
    viewBox="0 0 13 13"
  >
    <path stroke="#141B34" strokeLinejoin="round" d="M.5 12.5h12V.5H.5z"></path>
    <path stroke="#141B34" d="M12.5 6.5H.5M6.5.5v12"></path>
  </svg>
);
