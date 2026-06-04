import { cn } from "@/utils";
import { Map } from "maplibre-gl";
import { ToolTip } from "../../ui/tooltip";
import { ToolTipPlacement } from "@/enums";
import { useCallback } from "react";
import { useMapStore } from "@/store/map-store";

export const ZoomButton = ({
  onClick,
  disabled,
  icon,
  rounded = false,
  buttonClassName,
  iconClassName,
}: {
  onClick: () => void;
  disabled: boolean;
  icon: string;
  rounded?: boolean;
  buttonClassName?: string;
  iconClassName?: string;
}) => (
  <button
    className={cn(
      `p-2 bg-white ${rounded ? "rounded-[4px]" : ""} `,
      buttonClassName,
    )}
    onClick={onClick}
    disabled={disabled}
  >
    <span
      className={cn(
        "map-icon border-[2px] text-lg inline-flex items-center justify-center",
        disabled
          ? "border-gray-border text-gray-border cursor-not-allowed"
          : "text-dark border-dark",
        iconClassName,
      )}
    >
      {icon}
    </span>
  </button>
);

export const ZoomControls = ({
  map,
  rounded,
  className,
  buttonClassName,
  iconClassName,
  zoomInClassName,
  zoomOutClassName,
}: {
  map: Map | null;
  rounded?: boolean;
  className?: string;
  buttonClassName?: string;
  iconClassName?: string;
  zoomInClassName?: string;
  zoomOutClassName?: string;
}) => {
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
    <div className={cn("flex flex-col gap-y-[4px]", className)}>
      <ToolTip placement={ToolTipPlacement.RIGHT} content="Zoom In">
        <ZoomButton
          onClick={handleZoomIn}
          disabled={currentZoom >= Number(map?.getMaxZoom())}
          icon="+"
          rounded={rounded}
          buttonClassName={cn(buttonClassName, zoomInClassName)}
          iconClassName={iconClassName}
        />
      </ToolTip>
      <ToolTip placement={ToolTipPlacement.RIGHT} content="Zoom Out">
        <ZoomButton
          onClick={handleZoomOut}
          disabled={currentZoom <= Number(map?.getMinZoom())}
          icon="-"
          rounded={rounded}
          buttonClassName={cn(buttonClassName, zoomOutClassName)}
          iconClassName={iconClassName}
        />
      </ToolTip>
    </div>
  );
};
