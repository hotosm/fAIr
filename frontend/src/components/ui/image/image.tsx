import { cn } from "@/utils";
import { useEffect, useState } from "react";

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
    <>
      {isLoading && (
        <div className="animate-pulse bg-light-gray w-full h-full"></div>
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
        loading="lazy"
      />
    </>
  );
};

export default Image;
