import { IconProps } from "@/types";
import React from "react";

const YouTubePlayCircleIcon: React.FC<IconProps> = (props) => (
  <svg
    {...props}
    viewBox="0 0 21 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M9.35563 6.15498C8.52249 5.69354 7.5 6.29608 7.5 7.24847V12.7516C7.5 13.704 8.5225 14.3065 9.35563 13.8451L15.1134 10.6561C15.352 10.524 15.5 10.2727 15.5 10C15.5 9.7273 15.352 9.47607 15.1134 9.34393L9.35563 6.15498ZM10.5 0C4.97715 0 0.5 4.47715 0.5 10C0.5 15.5228 4.97715 20 10.5 20C16.0228 20 20.5 15.5228 20.5 10C20.5 4.47715 16.0228 0 10.5 0ZM2 10C2 5.30558 5.80558 1.5 10.5 1.5C15.1944 1.5 19 5.30558 19 10C19 14.6944 15.1944 18.5 10.5 18.5C5.80558 18.5 2 14.6944 2 10Z"
      fill="white"
    />
  </svg>
);

export default YouTubePlayCircleIcon;
