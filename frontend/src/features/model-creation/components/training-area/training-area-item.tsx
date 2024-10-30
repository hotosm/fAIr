import { DropDown } from "@/components/ui/dropdown";
import {
  CloudDownloadIcon,
  DeleteIcon,
  ElipsisIcon,
  FullScreenIcon,
  MapIcon,
  UploadArrowIcon,
} from "@/components/ui/icons";
import { useDropdownMenu } from "@/hooks/use-dropdown-menu";
import { formatDuration } from "@/utils";
import JOSMLogo from "@/assets/josm_logo.svg";
import OSMLogo from "@/assets/osm_logo.svg";
import { ToolTip } from "@/components/ui/tooltip";

export type TrainingAreaItemProps = {
  id: number;
  area: number;
  lastFetched: Date | null;
};

const dropdownMenuItems = [
  {
    tooltip: "Open in JOSM",
    isIcon: false,
    imageSrc: JOSMLogo,
  },
  {
    tooltip: "Open in ID Editor",
    isIcon: false,
    imageSrc: OSMLogo,
  },
  {
    tooltip: "Upload",
    isIcon: true,
    Icon: UploadArrowIcon,
  },
  {
    tooltip: "Hello",
    isIcon: true,
    Icon: CloudDownloadIcon,
  },
  {
    tooltip: "Download",
    isIcon: true,
    Icon: CloudDownloadIcon,
  },
  {
    tooltip: "Delete",
    isIcon: true,
    Icon: DeleteIcon,
    isDelete: true,
  },
];
const TrainingAreaItem: React.FC<TrainingAreaItemProps> = ({
  id,
  area,
  lastFetched,
}) => {
  const { onDropdownHide, onDropdownShow, dropdownIsOpened } =
    useDropdownMenu();
  return (
    <>
      <div className="flex items-center justify-between w-full">
        <div className="flex flex-col gap-y-1s">
          <p className="text-body-3">TA id{id}</p>
          <p className="text-body-4 text-dark">{area} sqm</p>
          <p className="text-body-4 text-dark">
            {lastFetched
              ? `Fetched ${formatDuration(lastFetched, new Date(), 1)} ago`
              : "No data yet"}
          </p>
        </div>
        <div className="flex items-center gap-x-3">
          <button className="bg-green-secondary px-2 py-1 rounded-md">
            <MapIcon className="icon text-green-primary" />
          </button>
          <button className="bg-off-white px-2 py-1 rounded-md">
            <FullScreenIcon className="icon" />
          </button>
          <DropDown
            disableCheveronIcon
            dropdownIsOpened={dropdownIsOpened}
            onDropdownHide={onDropdownHide}
            onDropdownShow={onDropdownShow}
            triggerComponent={
              <button className="bg-off-white p-2 rounded-full items-center flex justify-center">
                <ElipsisIcon className="icon" />
              </button>
            }
            className="text-right"
            distance={10}
          >
            <div className="flex gap-x-4 p-2 justify-between items-center bg-white">
              {dropdownMenuItems.map((item, id) => (
                <ToolTip
                  infoIcon={false}
                  content={item.tooltip}
                  key={`menu-item-${id}`}
                >
                  <button
                    className={` ${item.isDelete ? "text-primary bg-secondary" : "bg-off-white"}  w-8 h-8 p-1.5 items-center justify-center flex rounded-md`}
                    key={`dropdown-menu-item-${id}`}
                  >
                    {item.isIcon ? (
                      // @ts-expect-error bad type definition
                      <item.Icon className="icon-lg" />
                    ) : (
                      <img src={item.imageSrc} className="icon-lg" />
                    )}
                  </button>
                </ToolTip>
              ))}
            </div>
          </DropDown>
        </div>
      </div>
    </>
  );
};

export default TrainingAreaItem;
