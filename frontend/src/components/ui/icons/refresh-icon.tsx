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


export const HistoryIcon: React.FC<IconProps> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    fill="none"
    {...props}
    viewBox="0 0 20 20"
  >
    <path
      fill="#2C3038"
      d="M16.25 10a6.25 6.25 0 0 0-10.5-4.583h1.125a.625.625 0 1 1 0 1.25h-2.5a.625.625 0 0 1-.625-.625v-2.5a.625.625 0 1 1 1.25 0v.868a7.5 7.5 0 1 1-2.413 4.443.624.624 0 0 1 .627-.52c.383 0 .66.366.604.744Q3.75 9.53 3.75 10a6.25 6.25 0 1 0 12.5 0m-5.833-3.542a.625.625 0 0 0-1.25 0v3.75c0 .345.28.625.625.625h2.083a.625.625 0 1 0 0-1.25h-1.458z"
    ></path>
  </svg>
);


