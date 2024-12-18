import { cn } from "@/utils";
import { useCallback } from "react";
import { ToolTip } from "../../ui/tooltip";
import { ToolTipPlacement } from "@/enums";
import { Map } from "maplibre-gl";

const ZoomButton = ({
  onClick,
  disabled,
  icon,
}: {
  onClick: () => void;
  disabled: boolean;
  icon: string;
}) => (
  <button className={cn(`p-2 bg-white `)} onClick={onClick} disabled={disabled}>
    <span
      className={`map-icon border-[2px] ${disabled ? "border-gray-border text-gray-border  cursor-not-allowed" : "text-dark border-dark"} text-lg inline-flex items-center justify-center rounded-[4px]`}
    >
      {icon}
    </span>
  </button>
);

export const ZoomControls = ({ map, currentZoom }: { map: Map | null, currentZoom: number }) => {

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
    <div className="flex flex-col gap-y-[1px]">
      <ToolTip placement={ToolTipPlacement.RIGHT} content="Zoom In">
        <ZoomButton
          onClick={handleZoomIn}
          disabled={currentZoom >= Number(map?.getMaxZoom())}
          icon="+"
        />
      </ToolTip>
      <ToolTip placement={ToolTipPlacement.RIGHT} content="Zoom Out">
        <ZoomButton
          onClick={handleZoomOut}
          disabled={currentZoom <= Number(map?.getMinZoom())}
          icon="-"
        />
      </ToolTip>
    </div>
  );
};
