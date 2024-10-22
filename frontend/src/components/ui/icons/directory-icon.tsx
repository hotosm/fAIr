import { IconProps } from "@/types";
import React from "react";

const DirectoryIcon: React.FC<IconProps> = (props) => (
  <svg
    {...props}
    viewBox="0 0 31 26"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M0.5 5.5V20.5C0.5 23.2614 2.73858 25.5 5.5 25.5H25.5C28.2614 25.5 30.5 23.2614 30.5 20.5V8C30.5 5.23858 28.2614 3 25.5 3H13.4385L10.6559 0.773914C10.4342 0.596601 10.1588 0.5 9.875 0.5H5.5C2.73858 0.5 0.5 2.73858 0.5 5.5ZM3 5.5C3 4.11929 4.11929 3 5.5 3H9.43652L11.6068 4.73625L9.39174 6.74996H3V5.5ZM14.4832 5.5H25.5C26.8807 5.5 28 6.61929 28 8V20.5C28 21.8807 26.8807 23 25.5 23H5.5C4.11929 23 3 21.8807 3 20.5V9.24996H9.875C10.186 9.24996 10.4857 9.13406 10.7158 8.92489L14.4832 5.5Z"
      fill="currentColor"
    />
  </svg>
);

export default DirectoryIcon;