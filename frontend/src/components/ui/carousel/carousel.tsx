import React from "react";
import { SlCarousel, SlCarouselItem } from "@shoelace-style/shoelace/dist/react";
import { useBreakpoint, getSlidesPerPage } from "@/hooks/use-break-point";
import "./carousel.css";

type CarouselProps<T> = {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  isLoading?: boolean;
  loadingCount?: number;
  renderSkeleton?: (index: number) => React.ReactNode;
  navigation?: boolean;
  slidesPerMove?: number;
  ariaLabel?: string;
  style?: React.CSSProperties;
  containerClassName?: string; // wrapper div
  carouselClassName?: string;
};

export function Carousel<T>({
  items,
  renderItem,
  isLoading = false,
  loadingCount = 5,
  renderSkeleton,
  navigation = true,
  slidesPerMove = 1,
  ariaLabel = "carousel",
  style,
  containerClassName = "",
  carouselClassName = "updates-carousel",
}: CarouselProps<T>) {
  const { breakpoint } = useBreakpoint();
  const slidesPerPage = getSlidesPerPage(breakpoint);

  return (
    <div
      className={`relative carousel-container ${containerClassName}`}
      role="region"
      aria-roledescription="carousel"
      aria-label={ariaLabel}
    >
      <SlCarousel
        navigation={navigation}
        slidesPerPage={slidesPerPage}
        slidesPerMove={slidesPerMove}
        className={carouselClassName}
        style={
          {
            "--slide-gap": "1rem",
            "--aspect-ratio": "auto",
            ...style,
          } as React.CSSProperties
        }
      >
        {isLoading
          ? Array.from({ length: loadingCount }).map((_, index) => (
              <SlCarouselItem
                key={`skeleton-${index}`}
                aria-label={`Loading slide ${index + 1}`}
                aria-roledescription="slide"
              >
                {renderSkeleton ? renderSkeleton(index) : null}
              </SlCarouselItem>
            ))
          : items.map((item, index) => (
              <SlCarouselItem
                key={index}
                aria-label={`Slide ${index + 1} of ${items.length}`}
                aria-roledescription="slide"
              >
                {renderItem(item, index)}
              </SlCarouselItem>
            ))}
      </SlCarousel>
    </div>
  );
}
