import { IconProps } from "@/types";
import React from "react";

const StarIcon: React.FC<IconProps> = (props) => (
  <svg
    {...props}
    viewBox="0 0 22 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12.209 1.60263C11.7138 0.599249 10.283 0.599255 9.78782 1.60263L7.42988 6.38036L2.15735 7.1465C1.05005 7.3074 0.607914 8.66816 1.40916 9.44919L5.2244 13.1681L4.32374 18.4193C4.13459 19.5222 5.29213 20.3632 6.28252 19.8425L10.9984 17.3632L15.7143 19.8425C16.7047 20.3632 17.8622 19.5222 17.6731 18.4193L16.7724 13.1681L20.5877 9.44918C21.3889 8.66816 20.9468 7.3074 19.8395 7.1465L14.567 6.38036L12.209 1.60263ZM8.74008 7.11492L10.9984 2.53903L13.2568 7.11492C13.4534 7.51336 13.8335 7.78953 14.2732 7.85343L19.323 8.5872L15.6689 12.149C15.3508 12.4592 15.2056 12.906 15.2807 13.344L16.1433 18.3734L11.6266 15.9988C11.2333 15.792 10.7635 15.792 10.3702 15.9988L5.85353 18.3734L6.71614 13.344C6.79125 12.906 6.64606 12.4592 6.32788 12.149L2.67382 8.5872L7.72361 7.85343C8.16332 7.78953 8.54344 7.51336 8.74008 7.11492ZM0.164376 2.28151C-0.0943811 2.60495 -0.0419402 3.07692 0.281506 3.33568L2.78151 5.33568C3.10495 5.59444 3.57692 5.542 3.83568 5.21855C4.09444 4.8951 4.042 4.42313 3.71855 4.16438L1.21855 2.16438C0.895103 1.90562 0.423133 1.95806 0.164376 2.28151ZM21.8357 16.7185C22.0945 16.3951 22.042 15.9231 21.7186 15.6644L19.2186 13.6644C18.8951 13.4056 18.4232 13.4581 18.1644 13.7815C17.9056 14.105 17.9581 14.5769 18.2815 14.8357L20.7815 16.8357C21.105 17.0944 21.5769 17.042 21.8357 16.7185ZM0.281506 15.6644C-0.0419402 15.9231 -0.0943811 16.3951 0.164376 16.7186C0.423133 17.042 0.895103 17.0944 1.21855 16.8357L3.71855 14.8357C4.042 14.5769 4.09444 14.105 3.83568 13.7815C3.57692 13.4581 3.10495 13.4056 2.78151 13.6644L0.281506 15.6644ZM21.8357 2.28151C22.0945 2.60495 22.042 3.07692 21.7186 3.33568L19.2186 5.33568C18.8951 5.59444 18.4232 5.542 18.1644 5.21855C17.9056 4.8951 17.9581 4.42313 18.2815 4.16438L20.7815 2.16438C21.105 1.90562 21.5769 1.95806 21.8357 2.28151Z"
      fill="currentColor"
    />
  </svg>
);

export default StarIcon;