import { cn } from "@/utils";
import { useEffect, useState, useRef, useCallback } from "react";

type ImageProps = {
  src: string;
  alt: string;
  title?: string;
  width?: string | number;
  height?: string | number;
  className?: string;
  placeHolder?: string;
  loading?: "lazy" | "eager";
  sizes?: string;
  srcSet?: string;
  onLoad?: () => void;
  onError?: () => void;
};

const Image: React.FC<ImageProps> = ({
  src,
  alt,
  title,
  width,
  height,
  className,
  placeHolder,
  loading = "lazy",
  sizes,
  srcSet,
  onLoad,
  onError,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [imageSrc, setImageSrc] = useState(src);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setHasError(true);
    setIsLoading(false);
    if (placeHolder) {
      setImageSrc(placeHolder);
    }
    onError?.();
  }, [placeHolder, onError]);

  useEffect(() => {
    if (!src) return;

    // Reset states when src changes
    setIsLoading(true);
    setHasError(false);
    setImageSrc(src);

    // If image is already cached, it might load immediately
    if (imgRef.current?.complete && imgRef.current?.naturalWidth > 0) {
      setIsLoading(false);
    }
  }, [src]);

  // Don't render anything if no src and no placeholder
  if (!src && !placeHolder) {
    return null;
  }

  return (
    <picture className={cn("relative", className)}>
      {/* Loading skeleton */}
      {isLoading && (
        <div
          className="absolute inset-0 animate-pulse rounded bg-gray-200"
          style={{ width, height }}
        />
      )}
      {/* Main image */}
      <img
        ref={imgRef}
        src={imageSrc}
        alt={alt}
        title={title || alt}
        width={width}
        height={height}
        loading={loading}
        sizes={sizes}
        srcSet={srcSet}
        className={cn(
          "transition-opacity duration-300",
          isLoading ? "opacity-0" : "opacity-100",
          hasError && !placeHolder ? "hidden" : ""
        )}
        onLoad={handleLoad}
        onError={handleError}
        decoding="async"
      />
    </picture>
  );
};

export default Image;
