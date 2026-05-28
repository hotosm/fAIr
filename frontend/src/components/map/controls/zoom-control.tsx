import { cn } from "@/utils";
import { Map } from "maplibre-gl";
import { ToolTip } from "../../ui/tooltip";
import { ToolTipPlacement } from "@/enums";
import { useCallback } from "react";
import { useMapStore } from "@/store/map-store";

const ZoomButton = ({
  onClick,
  disabled,
  icon,
  rounded = false,
}: {
  onClick: () => void;
  disabled: boolean;
  icon: string;
  rounded?: boolean;
}) => (
  <button className={cn(`p-2 bg-white ${rounded ? "rounded-[4px]" : ""} `)} onClick={onClick} disabled={disabled}>
    <span
      className={`map-icon border-[2px] ${disabled ? "border-gray-border text-gray-border  cursor-not-allowed" : "text-dark border-dark"} text-lg inline-flex items-center justify-center `}
    >
      {icon}
    </span>
  </button>
);

export const ZoomControls = ({ map, rounded }: { map: Map | null; rounded?: boolean }) => {
  const currentZoom = useMapStore((state) => state.zoom);

  const handleZoomIn = useCallback(() => {
    if (map && currentZoom < map.getMaxZoom()) {
      map.zoomIn();
    }
  }, [map, currentZoom]);

  const handleZoomOut = useCallback(() => {
    if (map && currentZoom > map.getMinZoom()) {
      map.zoomOut();
    }
  }, [map, currentZoom]);

  return (
    <div className="flex flex-col gap-y-[4px]">
      <ToolTip placement={ToolTipPlacement.RIGHT} content="Zoom In">
        <ZoomButton
          onClick={handleZoomIn}
          disabled={currentZoom >= Number(map?.getMaxZoom())}
          icon="+"
          rounded={rounded}
        />
      </ToolTip>
      <ToolTip placement={ToolTipPlacement.RIGHT} content="Zoom Out">
        <ZoomButton
          onClick={handleZoomOut}
          disabled={currentZoom <= Number(map?.getMinZoom())}
          icon="-"
          rounded={rounded}
        />
      </ToolTip>
    </div>
  );
};
