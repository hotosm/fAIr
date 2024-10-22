import { IconProps } from "@/types";
import React from "react";

const SquareShadowIcon: React.FC<IconProps> = (props) => (
    <svg{...props} viewBox="0 0 20 21" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3.40039 0.899902C1.74354 0.899902 0.400391 2.24305 0.400391 3.8999L0.400391 12.2999C0.400391 13.9568 1.74354 15.2999 3.40039 15.2999H5.20039V17.0999C5.20039 18.7568 6.54354 20.0999 8.20039 20.0999H16.6004C18.2572 20.0999 19.6004 18.7568 19.6004 17.0999V8.6999C19.6004 7.04305 18.2572 5.6999 16.6004 5.6999H14.8004V3.8999C14.8004 2.24305 13.4572 0.899902 11.8004 0.899902L3.40039 0.899902ZM1.60039 3.8999C1.60039 2.90579 2.40628 2.0999 3.40039 2.0999L11.8004 2.0999C12.7945 2.0999 13.6004 2.90579 13.6004 3.8999V12.2999C13.6004 13.294 12.7945 14.0999 11.8004 14.0999H3.40039C2.40628 14.0999 1.60039 13.294 1.60039 12.2999L1.60039 3.8999Z" fill="currentColor"/>
    </svg>
);

export default SquareShadowIcon;
