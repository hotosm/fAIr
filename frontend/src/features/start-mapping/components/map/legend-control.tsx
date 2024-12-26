import { useCallback, useState } from "react";
import { LegendBookIcon } from "@/components/ui/icons";
import { LEGEND_NAME_MAPPING, MAP_STYLES_PREFIX } from "@/utils";
import { Map } from "maplibre-gl";
import useScreenSize from "@/hooks/use-screen-size";

import { startMappingPageContent } from "@/constants";

const FillLegendStyle = ({
  fillColor,
  fillOpacity,
}: {
  fillColor: string;
  fillOpacity: number;
}) => {
  return (
    <span
      className="block w-4 h-3 rounded-[2px] border-[1px]"
      style={{
        backgroundColor: `rgba(${parseInt(fillColor.slice(1, 3), 16)}, ${parseInt(fillColor.slice(3, 5), 16)}, ${parseInt(fillColor.slice(5, 7), 16)}, ${fillOpacity})`,
        borderColor: fillColor,
      }}
    ></span>
  );
};

export const Legend = ({ map }: { map: Map | null }) => {
  const [expandLegend, setExpandLegend] = useState<boolean>(true);

  const activeFillLayers =
    map
      ?.getStyle()
      .layers?.filter(
        (layer) =>
          layer.id.includes(MAP_STYLES_PREFIX) &&
          layer.layout?.visibility === "visible" &&
          layer.type === "fill",
      )
      .reverse() || [];

  const handleToggleExpand = useCallback(() => {
    setExpandLegend((prev) => !prev);
  }, []);

  const { isSmallViewport } = useScreenSize();

  return (
    <button
      disabled={!activeFillLayers}
      className={`flex items-center gap-x-4 bg-white p-2.5 ${isSmallViewport ? "rounded-xl border border-gray-border" : "absolute flex-col gap-y-4 left-3 bottom-3 rounded-[4px] border border-gray-border"}`}
      onClick={handleToggleExpand}
    >
      {!expandLegend && isSmallViewport && (
        <LegendBookIcon className="icon-lg" />
      )}
      {!isSmallViewport && (
        <p className="w-full text-dark font-semibold text-body-2base flex items-center gap-x-10 justify-between">
          {startMappingPageContent.map.controls.legendControl.title}
          <LegendBookIcon className="icon" />
        </p>
      )}
      {expandLegend && activeFillLayers ? (
        <div
          className={`flex  w-full ${isSmallViewport ? "flex-row gap-x-2" : "flex-col"} gap-y-3`}
        >
          {activeFillLayers?.map((layer, id) => (
            <p
              className="w-full flex items-center text-dark gap-x-2 text-body-4 md:text-body-3 text-nowrap"
              key={id}
            >
              {layer.type === "fill" ? (
                <FillLegendStyle
                  fillColor={layer.paint?.["fill-color"] as string}
                  fillOpacity={layer.paint?.["fill-opacity"] as number}
                />
              ) : null}
              {LEGEND_NAME_MAPPING[layer.id]}
            </p>
          ))}
        </div>
      ) : null}
      {expandLegend && isSmallViewport ? (
        <LegendBookIcon className="icon-lg" />
      ) : null}
    </button>
  );
};
