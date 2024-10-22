import { IconProps } from "@/types";
import React from "react";

const ElipsisIcon: React.FC<IconProps> = (props) => (
  <svg
    {...props}
    viewBox="0 0 10 3"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M2.80078 1.71509C2.80078 2.26737 2.35307 2.71509 1.80078 2.71509C1.2485 2.71509 0.800781 2.26737 0.800781 1.71509C0.800781 1.1628 1.2485 0.715088 1.80078 0.715088C2.35307 0.715088 2.80078 1.1628 2.80078 1.71509ZM6.00078 1.71509C6.00078 2.26737 5.55307 2.71509 5.00078 2.71509C4.4485 2.71509 4.00078 2.26737 4.00078 1.71509C4.00078 1.1628 4.4485 0.715088 5.00078 0.715088C5.55307 0.715088 6.00078 1.1628 6.00078 1.71509ZM8.20078 2.71509C8.75307 2.71509 9.20078 2.26737 9.20078 1.71509C9.20078 1.1628 8.75307 0.715088 8.20078 0.715088C7.6485 0.715088 7.20078 1.1628 7.20078 1.71509C7.20078 2.26737 7.6485 2.71509 8.20078 2.71509Z"
      fill="currentColor"
    />
  </svg>
);

export default ElipsisIcon;