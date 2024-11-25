import { IconProps } from "@/types";
import React from "react";

const TagsIcon: React.FC<IconProps> = (props) => (
  <svg
    {...props}
    viewBox="0 0 18 21"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M0.596505 12.66C0.278373 13.5132 0.46229 14.5111 1.14826 15.1971L4.7205 18.7694C6.58836 20.6372 9.61441 20.6448 11.4916 18.7864L16.7761 13.5547C17.2314 13.104 17.4876 12.4899 17.4876 11.8492V11.1626L11.4916 17.1063C11.4337 17.1636 11.3747 17.2192 11.3147 17.2729L10.6474 17.9336C9.23946 19.3274 6.96992 19.3217 5.56903 17.9208L4.97083 17.3226C4.88532 17.2484 4.80182 17.1706 4.7205 17.0893L1.14826 13.517C0.896965 13.2657 0.713047 12.9726 0.596505 12.66ZM8.04826 1.60285C8.49834 1.15276 9.10879 0.899902 9.74531 0.899902L15.0876 0.899902C16.4131 0.899902 17.4876 1.97442 17.4876 3.2999V8.54901C17.4876 9.18971 17.2314 9.80382 16.7761 10.2546L9.79462 17.1663C8.856 18.0955 7.34298 18.0917 6.40905 17.1578L1.14826 11.897C0.210998 10.9597 0.210998 9.4401 1.14826 8.50285L8.04826 1.60285ZM13.2 6.2999C13.8627 6.2999 14.4 5.76264 14.4 5.0999C14.4 4.43716 13.8627 3.8999 13.2 3.8999C12.5373 3.8999 12 4.43716 12 5.0999C12 5.76264 12.5373 6.2999 13.2 6.2999Z"
      fill="currentColor"
    />
  </svg>
);

export default TagsIcon;
