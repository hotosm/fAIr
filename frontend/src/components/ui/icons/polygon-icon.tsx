import { IconProps } from "@/types";
import React from "react";

export const PolygonIcon: React.FC<IconProps> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    {...props}
    fill="none"
    viewBox="0 0 16 16"
  >
    <path
      fill="#2C3038"
      d="M7.275 3.052a1.334 1.334 0 0 1-1.726.87l-2.436 6.822a1.334 1.334 0 0 1 .874 1.423l8.02 1.003a1.334 1.334 0 0 1 1.221-1.166l-.462-6.008-.101.004a1.333 1.333 0 0 1-1.278-1.715z"
      opacity="0.4"
    ></path>
    <circle
      cx="5.997"
      cy="2.666"
      r="1.333"
      stroke="#2C3038"
      strokeLinecap="round"
    ></circle>
    <circle
      cx="12.665"
      cy="4.666"
      r="1.333"
      stroke="#2C3038"
      strokeLinecap="round"
    ></circle>
    <circle
      cx="13.333"
      cy="13.333"
      r="1.333"
      stroke="#2C3038"
      strokeLinecap="round"
    ></circle>
    <circle
      cx="2.665"
      cy="11.999"
      r="1.333"
      stroke="#2C3038"
      strokeLinecap="round"
    ></circle>
    <path
      stroke="#2C3038"
      strokeLinecap="round"
      d="m7.275 3.049 4.112 1.233m1.38 1.713.462 6.008m-1.22 1.164-8.021-1.003m1.561-8.242-2.436 6.82"
    ></path>
  </svg>
);
