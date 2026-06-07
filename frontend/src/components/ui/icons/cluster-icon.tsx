import { IconProps } from "@/types";
import React from "react";

export const ClusterIcon: React.FC<IconProps> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    fill="none"
    {...props}
    viewBox="0 0 16 16"
  >
    <rect
      width="7.333"
      height="7.333"
      x="7.332"
      y="1.333"
      fill="#687075"
      opacity="0.3"
      rx="1.667"
    ></rect>
    <path
      fill="#687075"
      d="M8.332 11.666h-.667c-1.571 0-2.357 0-2.845-.488s-.488-1.274-.488-2.845v-1c-1.352.002-2.06.036-2.512.488-.488.488-.488 1.274-.488 2.845v.667c0 1.571 0 2.357.488 2.845s1.274.488 2.845.488h.667c1.571 0 2.357 0 2.845-.488.453-.452.486-1.16.488-2.512z"
      opacity="0.3"
    ></path>
    <rect
      width="7.333"
      height="7.333"
      x="7.332"
      y="1.333"
      stroke="#687075"
      strokeLinecap="round"
      strokeLinejoin="round"
      rx="1.667"
    ></rect>
    <path
      stroke="#687075"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M7.332 4.333c-1.352.002-2.06.036-2.512.488-.488.488-.488 1.274-.488 2.845v.667c0 1.571 0 2.357.488 2.845s1.274.488 2.845.488h.667c1.571 0 2.357 0 2.845-.488.453-.452.486-1.16.488-2.512"
    ></path>
    <path
      stroke="#687075"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4.332 7.333c-1.352.002-2.06.036-2.512.488-.488.488-.488 1.274-.488 2.845v.667c0 1.571 0 2.357.488 2.845s1.274.488 2.845.488h.667c1.571 0 2.357 0 2.845-.488.453-.452.486-1.16.488-2.512"
    ></path>
  </svg>
);
