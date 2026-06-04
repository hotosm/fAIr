import { IconProps } from "@/types";
import React from "react";

export const LocateGridIcon: React.FC<IconProps> = (props) => (
   <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    fill="none"
    {...props}
    viewBox="0 0 20 20"
  >
    <path
      stroke="#2C3038"
      strokeLinejoin="round"
      strokeWidth="1.25"
      d="M2.5 17.5h15v-15h-15z"
    ></path>
    <path stroke="#2C3038" strokeWidth="1.25" d="M17.5 10h-15M10 2.5v15"></path>
    <circle
      cx="10"
      cy="10"
      r="3.399"
      fill="#2C3038"
      stroke="#fff"
      strokeWidth="1.202"
    ></circle>
  </svg>
);
