import { DropDown } from "@/components/ui/dropdown";
import { DropdownMenuItem } from "@/components/ui/dropdown/dropdown";
import { ChevronDownIcon, CloudDownloadIcon, MapIcon } from "@/components/ui/icons";
import { DropdownPlacement, TryFairMapOutputType } from "@/enums";
import { useStartMappingStore } from "@/features/try-fair/utils/start-mapping-store";
import { buildChoropleth, toPointCollection } from "@/features/try-fair/utils/helpers";
import { geoJSONDowloader } from "@/utils/geo/geo-utils";

const getDownloadData = (
  predictions: GeoJSON.FeatureCollection,
  outputType: TryFairMapOutputType,
  predictionBBox: [number, number, number, number] | null,
  predictionGridZoom: number | null,
): GeoJSON.FeatureCollection => {
  if (outputType === TryFairMapOutputType.POINTS) {
    return toPointCollection(predictions);
  }
  if (outputType === TryFairMapOutputType.CLUSTER && predictionBBox) {
    return buildChoropleth(predictions, predictionBBox, predictionGridZoom ?? undefined);
  }
  return predictions;
};

const ExportMapResults = () => {
  const { setDownloadType, predictions, outputType, predictionBBox, predictionGridZoom } =
    useStartMappingStore();

  const hasPredictions = Boolean(predictions?.features?.length);

  const handleSelect = (value: string) => {
    if (value === "download") {
      if (!predictions) return;
      const exportData = getDownloadData(
        predictions,
        outputType,
        predictionBBox,
        predictionGridZoom,
      );
      geoJSONDowloader(exportData, `fair-predictions-${outputType.toLowerCase()}`);
      return;
    }
    setDownloadType(value);
  };

  const menuItems: DropdownMenuItem[] = [
    {
      label: "Download Map Result",
      value: "download",
      Icon: CloudDownloadIcon,
      disabled: !hasPredictions,
      onClick: () => handleSelect("download"),
    },
    {
      label: "Map Large Area",
      value: "large-area",
      Icon: MapIcon,
      dividerBefore: true,
      onClick: () => handleSelect("large-area"),
    },
  ];

  return (
    <DropDown
      placement={DropdownPlacement.BOTTOM_END}
      distance={8}
      disableCheveronIcon
      menuItems={menuItems}
      triggerComponent={
        <button className="bg-[#687075] gap-3 px-3 flex text-white items-center !w-fit !h-10 md:min-w-fit !rounded-md min-w-[7.5rem]">
          Export
          <ChevronDownIcon className="size-4" />
        </button>
      }
    />
  );
};

export default ExportMapResults;
