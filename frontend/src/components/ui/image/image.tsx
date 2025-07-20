import { useEffect, useState } from "react";

import { cn } from "@/utils";

type ImageProps = {
  src: string;
  alt: string;
  title?: string;
  width?: string;
  height?: string;
  className?: string;
  placeHolder?: string;
};

const Image: React.FC<ImageProps> = ({
  src,
  alt,
  title,
  width,
  height,
  className,
  placeHolder,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [imageSrc, setImageSrc] = useState(src);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setImageSrc(placeHolder || "");
    setIsLoading(false);
  };

  useEffect(() => {
    if (!src) return;
    setImageSrc(src);
  }, [src]);
  return (
    <picture>
      {isLoading && (
        <div className="size-full animate-pulse bg-light-gray"></div>
      )}
      <img
        src={imageSrc}
        alt={alt}
        title={title || alt}
        width={width}
        height={height}
        className={cn(`${className} ${isLoading ? "hidden" : ""}`)}
        onLoad={handleLoad}
        onError={handleError}
      />
    </picture>
  );
};

export default Image;
