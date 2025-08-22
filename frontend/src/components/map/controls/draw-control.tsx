import { useCallback } from "react";
import { DrawingModes, ToolTipPlacement } from "@/enums";
import { DeleteIcon } from "@/components/ui/icons";
import { TerraDraw } from "terra-draw";
import { ToolTip } from "@/components/ui/tooltip";
import { DrawIcon } from "@/components/ui/icons/draw-icon";

type DrawControlProps = {
  drawingMode: DrawingModes;
  terraDraw?: TerraDraw;
  setDrawingMode: (newMode: DrawingModes) => void;
  showDeleteButton?: boolean;
  onDelete?: () => void;
  onDrawingStateChange?: (isDrawing: boolean) => void;
  drawingIsActive?: boolean;
};

export const DrawControl = ({
  drawingMode,
  terraDraw,
  setDrawingMode,
  showDeleteButton = false,
  onDelete,
  onDrawingStateChange,
  drawingIsActive = false,
}: DrawControlProps) => {
  const handleClick = useCallback(() => {
    if (drawingIsActive) {
      setDrawingMode(DrawingModes.STATIC);
      terraDraw?.setMode(DrawingModes.STATIC);
      onDrawingStateChange?.(false);
    } else {
      setDrawingMode(drawingMode);
      terraDraw?.setMode(drawingMode);
      onDrawingStateChange?.(true);
    }
  }, [drawingIsActive, drawingMode, setDrawingMode, terraDraw]);

  return (
    <div className="relative inline-flex flex-col gap-y-2">
      <div>
        <ToolTip
          content={drawingIsActive ? "Cancel" : "Draw AOI"}
          placement={ToolTipPlacement.RIGHT}
          open={drawingIsActive}
        >
          <button
            className={`flex items-center justify-center p-1.5 transition-colors duration-200 ${drawingIsActive ? "bg-primary" : "bg-white"}`}
            onClick={handleClick}
            aria-pressed={drawingIsActive}
            type="button"
          >
            <DrawIcon
              className={`icon-lg transition-colors duration-200 ${drawingIsActive ? "text-white" : "text-dark"}`}
            />
          </button>
        </ToolTip>
      </div>

      {showDeleteButton && (
        <ToolTip content="Delete AOI" placement={ToolTipPlacement.RIGHT}>
          <button
            className="flex cursor-pointer items-center justify-center bg-white p-1.5 text-primary "
            type="button"
            onClick={() => {
              onDelete?.();
            }}
          >
            <DeleteIcon className="icon-lg" />
          </button>
        </ToolTip>
      )}
    </div>
  );
};
