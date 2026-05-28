import useScreenSize from "@/hooks/use-screen-size";
import { ArrowMoveIcon } from "@/components/ui/icons";
import { Map } from "maplibre-gl";
import { MAP_CONTENT } from "@/constants";
import { ToolTip } from "@/components/ui/tooltip";
import { useCallback } from "react";
import { cn } from "@/utils";

export const FitToBounds = ({
  map,
  bounds,
  mobileClassName = "p-2.5 border border-gray-border md:border-0",
  rounded = true,
  onClick,
  tooltipContent,
  buttonClassName,
  iconClassName,
}: {
  map: Map | null;
  bounds: any;
  mobileClassName?: string;
  rounded?: boolean;
  tooltipContent?: string;
  buttonClassName?: string;
  iconClassName?: string;

  /** Override the default fitBounds click handler. */
  onClick?: () => void;
}) => {
  const { isSmallViewport } = useScreenSize();

  const fitToBounds = useCallback(() => {
    if (onClick) {
      onClick();
      return;
    }
    if (!map || !bounds) return;
    map?.fitBounds(bounds);
  }, [map, bounds, onClick]);

  return (
    <ToolTip
      content={
        tooltipContent
          ? tooltipContent
          : MAP_CONTENT.controls.fitToBounds.tooltip
      }
    >
      <button
        className={cn(
          "bg-white",
          isSmallViewport ? mobileClassName : "p-1.5",
          rounded && "rounded-[4px]",
          buttonClassName,
        )}
        onClick={fitToBounds}
      >
        <ArrowMoveIcon className={cn("icon-lg", iconClassName)} />
      </button>
    </ToolTip>
  );
};
