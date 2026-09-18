import { useEffect, useRef, useState } from "react";
import type { Map, MapMouseEvent } from "maplibre-gl";

export const useToolTipVisibility = (
  map: Map | null,
  dependencies: any[] = [],
) => {
  const [tooltipVisible, setTooltipVisible] = useState<boolean>(false);
  const [tooltipPosition, setTooltipPosition] = useState<{
    x: number;
    y: number;
  }>({ x: 0, y: 0 });

  const TOOLTIP_OFFSET = 10;
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!map) return;

    const handleMouseMove = (event: MapMouseEvent) => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }

      rafIdRef.current = requestAnimationFrame(() => {
        setTooltipPosition({
          x: event.point.x + TOOLTIP_OFFSET,
          y: event.point.y + TOOLTIP_OFFSET,
        });
        setTooltipVisible(true);
      });
    };

    const handleMouseLeave = () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      setTooltipVisible(false);
    };

    map.on("mousemove", handleMouseMove);
    map.on("mouseout", handleMouseLeave);

    return () => {
      map.off("mousemove", handleMouseMove);
      map.off("mouseout", handleMouseLeave);
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [map, ...dependencies]);

  return { tooltipVisible, tooltipPosition, setTooltipVisible };
};
