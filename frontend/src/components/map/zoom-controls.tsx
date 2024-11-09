import { cn } from "@/utils";
import { Map } from "maplibre-gl";
import { useCallback, useEffect, useState } from "react";
import { ToolTip } from "../ui/tooltip";
import { ToolTipPlacement } from "@/enums";

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

const ZoomControls = ({ map }: { map: Map | null }) => {
  const [zoomLevel, setZoomLevel] = useState<number | null>(null);

  useEffect(() => {
    if (!map) return;
    setZoomLevel(map.getZoom());
    const handleZoomChange = () => setZoomLevel(map.getZoom());
    map.on("zoomend", handleZoomChange);
    return () => {
      map.off("zoomend", handleZoomChange);
    };
  }, [map]);

  const handleZoomIn = useCallback(() => {
    if (map && zoomLevel !== null && zoomLevel < map.getMaxZoom()) {
      map.zoomIn();
    }
  }, [map, zoomLevel]);

  const handleZoomOut = useCallback(() => {
    if (map && zoomLevel !== null && zoomLevel > map.getMinZoom()) {
      map.zoomOut();
    }
  }, [map, zoomLevel]);

  if (!map) return null;

  return (
    <div className="flex flex-col gap-y-[1px]">
      <ToolTip placement={ToolTipPlacement.RIGHT} content="Zoom In">
        <ZoomButton
          onClick={handleZoomIn}
          disabled={zoomLevel === map.getMaxZoom()}
          icon="+"
        />
      </ToolTip>
      <ToolTip placement={ToolTipPlacement.RIGHT} content="Zoom Out">
        {" "}
        <ZoomButton
          onClick={handleZoomOut}
          disabled={zoomLevel === map.getMinZoom()}
          icon="-"
        />
      </ToolTip>
    </div>
  );
};

export default ZoomControls;
