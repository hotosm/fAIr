import { IconProps } from "@/types";
import React from "react";

const GuageIcon: React.FC<IconProps> = (props) => (
  <svg
    width="30"
    height="34"
    viewBox="0 0 30 34"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M15 4.76676C22.824 4.76676 29.1666 11.1094 29.1666 18.9334C29.1666 26.7575 22.824 33.1001 15 33.1001C7.17595 33.1001 0.833313 26.7575 0.833313 18.9334C0.833313 11.1094 7.17595 4.76676 15 4.76676ZM15 7.26676C8.55666 7.26676 3.33331 12.4901 3.33331 18.9334C3.33331 25.3768 8.55666 30.6001 15 30.6001C21.4433 30.6001 26.6666 25.3768 26.6666 18.9334C26.6666 12.4901 21.4433 7.26676 15 7.26676ZM15 9.76676C15.6328 9.76676 16.1558 10.237 16.2386 10.8471L16.25 11.0168V18.5168C16.25 19.2071 15.6903 19.7668 15 19.7668C14.3672 19.7668 13.8442 19.2965 13.7614 18.6864L13.75 18.5168V11.0168C13.75 10.3264 14.3096 9.76676 15 9.76676ZM26.912 4.95628L27.0496 5.05602L28.9803 6.66298C29.5109 7.10463 29.583 7.89279 29.1414 8.42341C28.7366 8.90979 28.0405 9.01092 27.5186 8.68422L27.381 8.58449L25.4503 6.97752C24.9197 6.53587 24.8476 5.7477 25.2892 5.21709C25.6941 4.73071 26.3901 4.62958 26.912 4.95628ZM18.75 0.600098C19.4403 0.600098 20 1.15974 20 1.8501C20 2.48292 19.5297 3.00592 18.9196 3.08869L18.75 3.1001H11.25C10.5596 3.1001 9.99998 2.54045 9.99998 1.8501C9.99998 1.21727 10.4702 0.694279 11.0804 0.611509L11.25 0.600098H18.75Z"
      fill="currentColor"
    />
  </svg>
);

export default GuageIcon;
