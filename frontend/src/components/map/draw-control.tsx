import { DrawingModes, ToolTipPlacement } from "@/enums";
import { useCallback, useEffect, useState } from "react";
import { TerraDraw } from "terra-draw";
import { ToolTip } from "../ui/tooltip";
import { PenIcon } from "../ui/icons";

const DrawControl = ({ terraDraw }: { terraDraw: TerraDraw }) => {
  const [mode, setMode] = useState<DrawingModes>(DrawingModes.STATIC);
  const [featuresExist, setFeaturesExist] = useState(false);

  const changeMode = useCallback(
    (newMode: DrawingModes) => {
      setMode(newMode);
      terraDraw.setMode(newMode);
    },
    [terraDraw],
  );

  useEffect(() => {
    const handleFeatureChange = () => {
      setFeaturesExist(terraDraw.getSnapshot().length > 0);
    };

    terraDraw.on("change", handleFeatureChange);
    return () => {
      terraDraw.off("change", handleFeatureChange);
    };
  }, [terraDraw]);

  const renderButton = (
    currentMode: DrawingModes,
    activeMode: DrawingModes,
    label: string,
    isActive: boolean,
  ) => (
    <ToolTip content={label} placement={ToolTipPlacement.RIGHT}>
      <button
        className={`p-2 ${currentMode === activeMode ? "bg-primary" : "bg-white"} flex items-center justify-center`}
        onClick={() =>
          changeMode(
            currentMode === activeMode ? DrawingModes.STATIC : activeMode,
          )
        }
        disabled={activeMode === DrawingModes.SELECT && !featuresExist}
      >
        {activeMode === DrawingModes.SELECT ? (
          <PenIcon
            className={`icon ${isActive ? "text-white " : "text-dark"}`}
          />
        ) : (
          <div
            className={`border-[2px] ${isActive ? "border-white" : "border-dark"} rounded-md h-4 w-4`}
          ></div>
        )}
      </button>
    </ToolTip>
  );

  return (
    <>
      {renderButton(
        mode,
        DrawingModes.RECTANGLE,
        mode === DrawingModes.STATIC ? "Draw AOI" : "Stop Drawing",
        mode === DrawingModes.RECTANGLE,
      )}
      {/* {renderButton(
        mode,
        DrawingModes.SELECT,
        mode === DrawingModes.STATIC || mode === DrawingModes.RECTANGLE
          ? "Edit AOI"
          : "Stop Editing",
        mode === DrawingModes.SELECT,
      )} */}
    </>
  );
};

export default DrawControl;
