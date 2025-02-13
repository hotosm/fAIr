import { DrawingModes, ToolTipPlacement } from "@/enums";
import { PenIcon } from "@/components/ui/icons";
import { TerraDraw } from "terra-draw";
import { ToolTip } from "@/components/ui/tooltip";
import { useCallback } from "react";

export const DrawControl = ({
  drawingMode,
  terraDraw,
  setDrawingMode,
}: {
  drawingMode: DrawingModes;
  terraDraw?: TerraDraw;
  setDrawingMode: (newMode: DrawingModes) => void;
}) => {
  const changeMode = useCallback(
    (newMode: DrawingModes) => {
      terraDraw?.setMode(newMode);
      setDrawingMode(newMode);
    },
    [terraDraw],
  );

  const renderButton = (
    currentMode: DrawingModes,
    activeMode: DrawingModes,
    label: string,
    isActive: boolean,
  ) => (
    <ToolTip
      content={label}
      placement={ToolTipPlacement.RIGHT}
      open={drawingMode === DrawingModes.RECTANGLE}
    >
      <button
        className={`p-2 ${currentMode === activeMode ? "bg-primary" : "bg-white"} flex items-center justify-center`}
        onClick={() =>
          changeMode(
            currentMode === activeMode ? DrawingModes.STATIC : activeMode,
          )
        }
      >
        {activeMode === DrawingModes.SELECT ? (
          <PenIcon
            className={`icon ${isActive ? "text-white " : "text-dark"}`}
          />
        ) : (
          <div
            className={`border-[2px] ${isActive ? "border-white" : "border-dark"} rounded-[4px] map-icon`}
          ></div>
        )}
      </button>
    </ToolTip>
  );

  return (
    <>
      {renderButton(
        drawingMode,
        DrawingModes.RECTANGLE,
        drawingMode === DrawingModes.STATIC ? "Draw AOI" : "Cancel",
        drawingMode === DrawingModes.RECTANGLE,
      )}
    </>
  );
};
