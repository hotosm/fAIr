import { IconProps, ShoelaceSlotProps } from "@/types";
import React from "react";

const ChevronDownIcon: React.FC<ShoelaceSlotProps & IconProps> = (props) => (
  <svg
    viewBox="0 0 16 8"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M14.9517 0.279255C15.2945 0.639161 15.2807 1.20884 14.9208 1.55167L8.6202 7.55327C8.2726 7.88438 7.7263 7.88438 7.3787 7.55327L1.07814 1.55167C0.718236 1.20884 0.704393 0.639161 1.04722 0.279254C1.39005 -0.0806528 1.95973 -0.0944967 2.31964 0.248333L7.99945 5.65864L13.6793 0.248333C14.0392 -0.0944962 14.6089 -0.0806522 14.9517 0.279255Z"
      fill="currentColor"
    />
  </svg>
);

export default ChevronDownIcon;
