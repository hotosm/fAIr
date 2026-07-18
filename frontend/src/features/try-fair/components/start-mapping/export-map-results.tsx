import { JOSMLogo } from "@/assets/svgs";
import { DropDown } from "@/components/ui/dropdown";
import { DropdownMenuItem } from "@/components/ui/dropdown/dropdown";
import {
  ChevronDownIcon,
  CloudDownloadIcon,
  MapIcon,
} from "@/components/ui/icons";
import { DropdownPlacement } from "@/enums";
import { useStartMappingStore } from "@/features/try-fair/utils/start-mapping-store";

export const EXPORT_MAP_MENU_ITEMS: Omit<DropdownMenuItem, "onClick">[] = [
  {
    label: "Download Map Result",
    value: "download",
    Icon: CloudDownloadIcon,
  },
  {
    label: "Open in JOSM",
    value: "josm",
    imgSrc: JOSMLogo,
  },
  {
    label: "Map Large Area",
    value: "large-area",
    Icon: MapIcon,
    dividerBefore: true,
  },
];

const ExportMapResults = () => {
  const { setDownloadType } = useStartMappingStore();

  const handleSelect = (value: string) => {
    setDownloadType(value);
  };

  const menuItems: DropdownMenuItem[] = EXPORT_MAP_MENU_ITEMS.map((item) => ({
    ...item,
    onClick: () => handleSelect(item.value),
  }));

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
