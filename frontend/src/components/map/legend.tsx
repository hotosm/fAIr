import { useState } from "react";
import { LegendBookIcon } from "../ui/icons";
import { useMap } from "@/app/providers/map-provider";
import { LEGEND_NAME_MAPPING, MAP_STYLES_PREFIX } from "@/utils";

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

const Legend = () => {
  const [expandLegend, setExpandLegend] = useState<boolean>(false);
  const { map } = useMap();

  const activeLayers = map
    ?.getStyle()
    .layers?.filter(
      (layer) =>
        layer.id.includes(MAP_STYLES_PREFIX) &&
        layer.layout?.visibility === "visible",
    );

  return (
    <button
      className="absolute bottom-5 left-3 z-[1] bg-white p-3 rounded-[4px] shadow-md border border-gray-border"
      onClick={() => {
        setExpandLegend(!expandLegend);
      }}
    >
      <p className="w-full text-dark font-semibold text-body-2base flex items-center gap-x-14 justify-between mb-2">
        Legend <LegendBookIcon className="icon" />
      </p>
      {expandLegend ? (
        <div className="flex flex-col gap-y-3">
          {activeLayers?.map((layer, id) => (
            <p
              className="w-full flex  items-center text-dark gap-x-4 text-body-3"
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
    </button>
  );
};

export default Legend;
