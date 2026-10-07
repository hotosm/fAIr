import { TryFairMapOutputType } from "@/enums/try-fair";
import { IconProps } from "@/types";
import React from "react";

type Props = IconProps & {
  outputType: TryFairMapOutputType;
};

export const TryFairPredictionOutputIcon: React.FC<Props> = ({
  outputType,
  ...props
}) => {
  if (outputType === TryFairMapOutputType.POINTS) {
    return (
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
      >
        <circle cx="8" cy="8" r="4" fill="#A147D8" />
      </svg>
    );
  }

  if (outputType === TryFairMapOutputType.CLUSTER) {
    return (
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
      >
        <rect x="2.5" y="2.5" width="5" height="5" rx="1" fill="#A147D8" />
        <rect x="8.5" y="2.5" width="5" height="5" rx="1" fill="#A147D8" />
        <rect x="2.5" y="8.5" width="5" height="5" rx="1" fill="#A147D8" />
        <rect x="8.5" y="8.5" width="5" height="5" rx="1" fill="#A147D8" />
      </svg>
    );
  }

  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect x="2.5" y="2.5" width="11" height="11" rx="2" fill="#A147D8" />
    </svg>
  );
};
