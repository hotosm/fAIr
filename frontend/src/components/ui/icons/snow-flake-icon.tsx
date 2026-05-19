import { IconProps } from "@/types";
import React from "react";

export const SnowflakeIcon: React.FC<IconProps> = (props) => (
   <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    fill="none"
    {...props}
    viewBox="0 0 20 20"
  >
    <path
      stroke="#08F"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.25"
      d="m17.5 11.875-.693-.55c-.788-.624-1.182-.937-1.182-1.325s.394-.7 1.182-1.326l.693-.549"
    ></path>
    <path
      fill="#08F"
      d="M4.375 10.003 7.188 5.13l5.625.003 2.812 4.87-2.812 4.87-5.626.003z"
      opacity="0.4"
    ></path>
    <path
      stroke="#08F"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.25"
      d="m2.5 8.125.693.55c.788.624 1.182.937 1.182 1.325s-.394.7-1.182 1.326l-.693.549"
    ></path>
    <path
      stroke="#08F"
      strokeLinejoin="round"
      strokeWidth="1.25"
      d="M15.625 10H4.375"
    ></path>
    <path
      stroke="#08F"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.25"
      d="m11.875 17.5.15-.932c.17-1.06.254-1.59.643-1.797.388-.207.928-.01 2.008.384l.949.347M8.125 2.5l-.15.932c-.17 1.06-.254 1.59-.642 1.797-.389.207-.929.01-2.009-.385l-.949-.346"
    ></path>
    <path
      stroke="#08F"
      strokeLinejoin="round"
      strokeWidth="1.25"
      d="M12.813 14.871 7.187 5.128"
    ></path>
    <path
      stroke="#08F"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.25"
      d="m15.625 4.498-.95.346c-1.08.395-1.62.592-2.008.385s-.473-.737-.643-1.797l-.149-.932M4.375 15.502l.95-.347c1.08-.394 1.62-.591 2.008-.384s.473.737.643 1.797l.149.932"
    ></path>
    <path
      stroke="#08F"
      strokeLinejoin="round"
      strokeWidth="1.25"
      d="m12.813 5.129-5.626 9.743"
    ></path>
  </svg>
);
