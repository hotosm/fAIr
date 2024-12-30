import { Map, MapMouseEvent } from 'maplibre-gl';
import { useEffect, useState } from 'react';

export const useToolTipVisibility = (
  map: Map | null,
  dependencies: any[] = [],
) => {
  const [tooltipVisible, setTooltipVisible] = useState<boolean>(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const TOOLTIP_OFFSET = 10;

  useEffect(() => {
    if (!map) return;
    const handleMouseMove = (event: MapMouseEvent) => {
      setTooltipPosition({
        x: event.point.x + TOOLTIP_OFFSET,
        y: event.point.y + TOOLTIP_OFFSET,
      });
      setTooltipVisible(true);
    };
    const handleMouseLeave = () => {
      setTooltipVisible(false);
    };

    map.on("mousemove", handleMouseMove);
    map.on("mouseout", handleMouseLeave);

    return () => {
      map.off("mousemove", handleMouseMove);
      map.off("mouseout", handleMouseLeave);
    };
  }, [map, ...dependencies]);

  return { tooltipVisible, tooltipPosition, setTooltipVisible };
};
