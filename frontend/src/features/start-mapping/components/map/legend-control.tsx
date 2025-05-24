import { LegendBookIcon } from "@/components/ui/icons";
import { ToolTip } from "@/components/ui/tooltip";
import useScreenSize from "@/hooks/use-screen-size";
import { START_MAPPING_PAGE_CONTENT } from "@/constants";
import { useState, useCallback } from "react";
import { PredictedFeatureStatus } from "@/enums/start-mapping";
import { PREDICTED_LAYER_STATUS_COLORS } from "@/config";

const statusLegend = [
  {
    status: PredictedFeatureStatus.ACCEPTED,
    label:
      START_MAPPING_PAGE_CONTENT.map.controls.legendControl.acceptedPredictions,
    fillColor: PREDICTED_LAYER_STATUS_COLORS[PredictedFeatureStatus.ACCEPTED],
    fillOpacity: 0.3,
  },
  {
    status: PredictedFeatureStatus.REJECTED,
    label:
      START_MAPPING_PAGE_CONTENT.map.controls.legendControl.rejectedPredictions,
    fillColor: PREDICTED_LAYER_STATUS_COLORS[PredictedFeatureStatus.REJECTED],
    fillOpacity: 0.3,
  },
  {
    status: PredictedFeatureStatus.UNTOUCHED,
    label:
      START_MAPPING_PAGE_CONTENT.map.controls.legendControl.predictionResults,
    fillColor: PREDICTED_LAYER_STATUS_COLORS[PredictedFeatureStatus.UNTOUCHED],
    fillOpacity: 0.3,
  },
];

const FillLegendStyle = ({
  fillColor,
  fillOpacity,
}: {
  fillColor: string;
  fillOpacity: number;
}) => (
  <span
    className="block w-4 h-3 rounded-[2px] border-[1px]"
    style={{
      backgroundColor: `rgba(${parseInt(fillColor.slice(1, 3), 16)}, ${parseInt(
        fillColor.slice(3, 5),
        16,
      )}, ${parseInt(fillColor.slice(5, 7), 16)}, ${fillOpacity})`,
      borderColor: fillColor,
    }}
  ></span>
);

export const Legend = () => {
  const { isSmallViewport } = useScreenSize();
  const [expandLegend, setExpandLegend] = useState(true);

  const handleToggleExpand = useCallback(() => {
    setExpandLegend((prev) => !prev);
  }, []);

  return (
    <button
      className={`flex z-10 items-center gap-x-4 bg-white p-2.5 rounded-xl ${
        isSmallViewport
          ? "border border-gray-border"
          : "absolute flex-col gap-y-4 left-3 bottom-3 rounded-[4px] border border-gray-border"
      }`}
      onClick={handleToggleExpand}
    >
      {!expandLegend && isSmallViewport && (
        <ToolTip
          content={
            START_MAPPING_PAGE_CONTENT.map.controls.legendControl.toolTip.show
          }
        >
          <LegendBookIcon className="icon-lg" />
        </ToolTip>
      )}

      {!isSmallViewport && (
        <p className="w-full text-dark font-semibold text-body-2base flex items-center gap-x-10 justify-between">
          {START_MAPPING_PAGE_CONTENT.map.controls.legendControl.title}
          <ToolTip
            content={
              expandLegend
                ? START_MAPPING_PAGE_CONTENT.map.controls.legendControl.toolTip
                    .hide
                : START_MAPPING_PAGE_CONTENT.map.controls.legendControl.toolTip
                    .show
            }
          >
            <LegendBookIcon className="icon" />
          </ToolTip>
        </p>
      )}

      {expandLegend && (
        <div
          className={`flex w-full ${isSmallViewport ? "flex-row gap-x-2" : "flex-col"} gap-y-3`}
        >
          {statusLegend.map(({ label, fillColor, fillOpacity }, id) => (
            <p
              className="w-full flex items-center text-dark gap-x-2 text-body-4 md:text-body-3 text-nowrap"
              key={id}
            >
              <FillLegendStyle
                fillColor={fillColor}
                fillOpacity={fillOpacity}
              />
              {label}
            </p>
          ))}
        </div>
      )}

      {expandLegend && isSmallViewport && (
        <ToolTip
          content={
            START_MAPPING_PAGE_CONTENT.map.controls.legendControl.toolTip.hide
          }
        >
          <LegendBookIcon className="icon-lg" />
        </ToolTip>
      )}
    </button>
  );
};
