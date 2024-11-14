import { IconProps } from "@/types";
import React from "react";

const TextIcon: React.FC<IconProps> = (props) => (
  <svg
    {...props}
    viewBox="0 0 18 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M18 2.75C18 1.23122 16.7688 0 15.25 0L2.75 0C1.23122 0 0 1.23122 0 2.75L0 15.25C0 16.7688 1.23122 18 2.75 18H15.25C16.7688 18 18 16.7688 18 15.25V2.75ZM11.25 8.5C11.6642 8.5 12 8.83579 12 9.25C12 9.6297 11.7178 9.94349 11.3518 9.99315L11.25 10H3.75C3.33579 10 3 9.66421 3 9.25C3 8.8703 3.28215 8.55651 3.64823 8.50685L3.75 8.5H11.25ZM3.75 12.5H14.25C14.6642 12.5 15 12.8358 15 13.25C15 13.6297 14.7178 13.9435 14.3518 13.9932L14.25 14H3.75C3.33579 14 3 13.6642 3 13.25C3 12.8703 3.28215 12.5565 3.64823 12.5068L3.75 12.5ZM14.25 4.5C14.6642 4.5 15 4.83579 15 5.25C15 5.6297 14.7178 5.94349 14.3518 5.99315L14.25 6L3.75 6C3.33579 6 3 5.66421 3 5.25C3 4.8703 3.28215 4.55651 3.64823 4.50685L3.75 4.5L14.25 4.5Z"
      fill="currentColor"
    />
  </svg>
);

export default TextIcon;