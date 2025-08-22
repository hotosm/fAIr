import { DrawingModes } from "@/enums";
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
  dependencies?: (DrawingModes | number)[];
  minZoom?: number;
}) => {
  const currentZoom = useMapStore((state) => state.zoom);
  const { tooltipPosition, tooltipVisible } = useToolTipVisibility(map, [
    currentZoom,
    ...(dependencies || []),
  ]);

  return (
    <div
      className={`w-50 pointer-events-none absolute flex flex-col text-nowrap rounded-lg px-2 text-white shadow-2xl ${color}`}
      style={{
        left: `${tooltipPosition.x}px`,
        top: `${tooltipPosition.y}px`,
      }}
    >
      {showTooltip && tooltipVisible && children}
    </div>
  );
};
