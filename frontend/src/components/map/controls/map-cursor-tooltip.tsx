import { useToolTipVisibility } from "@/hooks/use-tooltip-visibility";
import { useMapStore } from "@/store/map-store";
import { Map } from "maplibre-gl";

export const MapCursorToolTip = ({
  color = "bg-black",
  map,
  showTooltip,
  children,
  dependencies,
}: {
  color?: string;
  map: Map | null;
  showTooltip: boolean;
  children: React.ReactNode;
  dependencies?: any[];
  minZoom?: number;
}) => {
  const currentZoom = useMapStore((state) => state.zoom);
  const { tooltipPosition, tooltipVisible } = useToolTipVisibility(map, [
    currentZoom,
    ...(dependencies || []),
  ]);

  return (
    <div
      className={`absolute w-50 text-white px-2 pointer-events-none text-nowrap rounded-lg shadow-2xl flex flex-col ${color}`}
      style={{
        left: `${tooltipPosition.x}px`,
        top: `${tooltipPosition.y}px`,
      }}
    >
      {showTooltip && tooltipVisible && children}
    </div>
  );
};
