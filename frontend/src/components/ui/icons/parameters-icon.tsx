import { IconProps } from "@/types";
import React from "react";

export const ParametersIcon: React.FC<IconProps> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="15"
    height="15"
    {...props}
    fill="none"
    viewBox="0 0 15 15"
  >
    <path
      stroke="#141B34"
      d="M6.649 3.167v1.326c0 .932 0 1.398.124 1.846.125.447.37.858.86 1.68l.662 1.113c1.247 2.095 1.87 3.142 1.36 3.918l-.009.011c-.519.773-1.839.773-4.48.773-2.64 0-3.96 0-4.479-.772L.68 13.05c-.511-.777.112-1.824 1.359-3.918l.663-1.113c.49-.822.734-1.233.859-1.68.125-.448.125-.914.125-1.846V3.167"
    ></path>
    <path stroke="#141B34" strokeLinecap="round" strokeLinejoin="round" d="M3.168 3.167h4"></path>
    <path
      stroke="#141B34"
      strokeLinecap="round"
      d="M2.832 8.02c.444-.388 1.49-.108 2.334.256 1.112.479 2.11.092 2.333-.256"
    ></path>
    <path
      stroke="#141B34"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6.835 3.833c0 1.334 1.575 2.808 2.648 2.667 0 1.105.974 2 2.176 2 1.201 0 2.176-.895 2.176-2s-.667-2-2-2c0-1.333-1-2.667-2.414-2.667C9.421.805 8.835.5 8.168.5s-1 .667-1 .667-2 0-2 2"
    ></path>
  </svg>
);
