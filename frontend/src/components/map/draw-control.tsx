import { DrawingModes, ToolTipPlacement } from "@/enums";
import { useCallback, useEffect, useState } from "react";
import { TerraDraw } from "terra-draw";
import { ToolTip } from "@/components/ui/tooltip";
import { PenIcon } from "@/components/ui/icons";
import { Map, MapMouseEvent } from "maplibre-gl";
import {
  calculateGeoJSONArea,
  MAX_TRAINING_AREA_SIZE,
  MIN_TRAINING_AREA_SIZE,
} from "@/utils";

const DrawControl = ({
  terraDraw,
  map,
}: {
  map: Map | null;
  terraDraw: TerraDraw;
}) => {
  const [featuresExist, setFeaturesExist] = useState(false);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [featureArea, setFeatureArea] = useState<number>(0);
  const [mode, setMode] = useState<DrawingModes>(DrawingModes.STATIC);

  const changeMode = useCallback(
    (newMode: DrawingModes) => {
      terraDraw.setMode(newMode);
      setMode(newMode);
      setFeatureArea(0);
    },
    [terraDraw],
  );

  useEffect(() => {
    const handleFeatureChange = () => {
      setMode(terraDraw.getMode() as DrawingModes);
      const snapshot = terraDraw.getSnapshot();
      setFeaturesExist(snapshot.length > 0);
      const area = calculateGeoJSONArea(snapshot[snapshot.length - 1]);
      setFeatureArea(area);
    };

    const cleanUp = () => {
      setFeatureArea(0);
      changeMode(DrawingModes.STATIC);
      setTooltipVisible(false);
    };

    terraDraw.on("change", handleFeatureChange);
    terraDraw.on("finish", cleanUp);
    return () => {
      terraDraw.off("change", handleFeatureChange);
      terraDraw.off("finish", cleanUp);
    };
  }, [terraDraw]);

  useEffect(() => {
    if (!map) return;

    const handleMouseMove = (event: MapMouseEvent) => {
      if (mode === DrawingModes.RECTANGLE) {
        setTooltipPosition({ x: event.point.x, y: event.point.y });
        setTooltipVisible(true);
      }
    };

    const handleMouseLeave = () => {
      setTooltipVisible(false);
    };

    map.on("mousemove", handleMouseMove);
    map.on("mouseout", handleMouseLeave);

    return () => {
      map.off("mousemove", handleMouseMove);
      map.off("mouseout", handleMouseLeave);
    };
  }, [mode, map]);

  const renderButton = (
    currentMode: DrawingModes,
    activeMode: DrawingModes,
    label: string,
    isActive: boolean,
  ) => (
    <ToolTip
      content={label}
      placement={ToolTipPlacement.RIGHT}
      open={featureArea > 0 || mode === DrawingModes.RECTANGLE}
    >
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
            className={`border-[2px] ${isActive ? "border-white" : "border-dark"} rounded-[4px] map-icon`}
          ></div>
        )}
      </button>
    </ToolTip>
  );

  const getTooltipColor = () => {
    if (featureArea !== 0) {
      if (
        featureArea < MIN_TRAINING_AREA_SIZE ||
        featureArea > MAX_TRAINING_AREA_SIZE
      )
        return "bg-primary";
    }
    return "bg-black";
  };

  const getFeedbackMessage = () => {
    if (featureArea !== 0) {
      if (featureArea < MIN_TRAINING_AREA_SIZE)
        return "Area too small. Expand to meet minimum size requirement.";
      if (featureArea > MAX_TRAINING_AREA_SIZE)
        return "Area too large. Reduce to meet maximum size requirement.";
      if (
        featureArea < MIN_TRAINING_AREA_SIZE * 1.2 ||
        featureArea > MAX_TRAINING_AREA_SIZE * 0.8
      ) {
        return "Area is close to size limits. Adjust if needed before completing.";
      }
      return "Area within acceptable range. Release mouse to finish drawing.";
    }
    return;
  };

  return (
    <>
      {renderButton(
        mode,
        DrawingModes.RECTANGLE,
        mode === DrawingModes.STATIC ? "Draw AOI" : "Cancel",
        mode === DrawingModes.RECTANGLE,
      )}
      {tooltipVisible && (
        <div
          className={`absolute w-50 text-white px-2 rounded-sm pointer-events-none text-nowrap flex flex-col ${getTooltipColor()}`}
          style={{
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`,
          }}
        >
          <p>
            {mode === DrawingModes.RECTANGLE && featureArea === 0
              ? "Click and drag to draw a rectangle."
              : `Current area: ${featureArea.toFixed(2)} m²`}
          </p>
          <p>{getFeedbackMessage()}</p>
        </div>
      )}
    </>
  );
};

export default DrawControl;
