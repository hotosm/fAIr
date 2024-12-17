import { IconProps, ShoelaceSlotProps } from "@/types";
import React from "react";

export const CheckIcon: React.FC<ShoelaceSlotProps & IconProps> = (props) => (
  <svg
    {...props}
    viewBox="0 0 14 10"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12.9345 1.20068C13.2186 1.50211 13.2045 1.97678 12.9031 2.26088L4.97324 9.73477C4.63696 10.0517 4.10909 10.0419 3.78477 9.71279L1.10443 6.99245C0.813713 6.6974 0.817229 6.22254 1.11228 5.93182C1.40734 5.64111 1.8822 5.64462 2.17291 5.93968L4.40706 8.20716L11.8743 1.1693C12.1757 0.885202 12.6504 0.899252 12.9345 1.20068Z"
      fill="currentColor"
    />
  </svg>
);

