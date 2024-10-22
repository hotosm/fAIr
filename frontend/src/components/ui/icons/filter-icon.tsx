import { IconProps } from "@/types";
import React from "react";

const FilterIcon: React.FC<IconProps> = (props) => (
  <svg
    {...props}
    viewBox="0 0 20 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M6.75 9.5C8.28619 9.5 9.57345 10.5658 9.91264 11.9983L19.25 12C19.6642 12 20 12.3358 20 12.75C20 13.1297 19.7178 13.4435 19.3518 13.4932L19.25 13.5L9.91288 13.5007C9.57405 14.9337 8.28655 16 6.75 16C5.21345 16 3.92594 14.9337 3.58712 13.5007L0.75 13.5C0.335786 13.5 0 13.1642 0 12.75C0 12.3703 0.282154 12.0565 0.648229 12.0068L0.75 12L3.58712 11.9993C3.92594 10.5663 5.21345 9.5 6.75 9.5ZM6.75 11C5.98586 11 5.33611 11.4898 5.09753 12.1725L5.07696 12.2352L5.03847 12.3834C5.01326 12.5016 5 12.6242 5 12.75C5 12.9048 5.02011 13.055 5.05785 13.1979L5.09766 13.3279L5.12335 13.3966C5.38055 14.0431 6.01191 14.5 6.75 14.5C7.51376 14.5 8.16324 14.0107 8.40212 13.3285L8.44218 13.1978L8.4251 13.2581C8.47381 13.0973 8.5 12.9267 8.5 12.75C8.5 12.6452 8.49078 12.5425 8.47312 12.4428L8.44309 12.3057L8.42308 12.2353L8.37625 12.1024C8.11881 11.4565 7.48771 11 6.75 11ZM13.25 0C14.7866 0 16.0741 1.06632 16.4129 2.49934L19.25 2.5C19.6642 2.5 20 2.83579 20 3.25C20 3.6297 19.7178 3.94349 19.3518 3.99315L19.25 4L16.4129 4.00066C16.0741 5.43368 14.7866 6.5 13.25 6.5C11.7134 6.5 10.4259 5.43368 10.0871 4.00066L0.75 4C0.335786 4 0 3.66421 0 3.25C0 2.8703 0.282154 2.55651 0.648229 2.50685L0.75 2.5L10.0874 2.49833C10.4265 1.06582 11.7138 0 13.25 0ZM13.25 1.5C12.4859 1.5 11.8361 1.98976 11.5975 2.6725L11.577 2.73515L11.5385 2.88337C11.5133 3.0016 11.5 3.12425 11.5 3.25C11.5 3.40483 11.5201 3.55497 11.5579 3.69794L11.5977 3.82787L11.6234 3.89664C11.8805 4.54307 12.5119 5 13.25 5C14.0138 5 14.6632 4.51073 14.9021 3.82852L14.9422 3.69781L14.9251 3.75808C14.9738 3.59729 15 3.4267 15 3.25C15 3.14518 14.9908 3.04251 14.9731 2.94275L14.9431 2.80565L14.9231 2.73529L14.8763 2.60236C14.6188 1.95647 13.9877 1.5 13.25 1.5Z"
      fill="currentColor"
    />
  </svg>
);

export default FilterIcon;