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
import { formatDuration, truncateString } from "@/utils";
import JOSMLogo from "@/assets/josm_logo.svg";
import OSMLogo from "@/assets/osm_logo.svg";
import { ToolTip } from "@/components/ui/tooltip";
import { TTrainingAreaFeature } from "@/types";
import { useDeleteTrainingArea } from "../../hooks/use-training-areas";
import { useToast } from "@/app/providers/toast-provider";

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
const TrainingAreaItem: React.FC<
  TTrainingAreaFeature & { datasetId: number }
> = ({ id, properties, datasetId }) => {
  const { onDropdownHide, onDropdownShow, dropdownIsOpened } =
    useDropdownMenu();

  const { notify } = useToast();
  const deleteTrainingAreaMutation = useDeleteTrainingArea({
    datasetId: datasetId,
    mutationConfig: {
      onSuccess: () => {
        notify("Training area deleted successfully", "success");
      },
      onError: (error) => {
        notify(error?.response?.data?.detail, "danger");
      },
    },
  });

  return (
    <>
      <div className="flex items-center justify-between w-full gap-x-4">
        <div className="flex flex-col gap-y-1">
          <p className="text-body-3">TA id{id}</p>
          {/* <p className="text-body-4 text-dark">{area} sqm</p> */}
          <p className="text-body-4 text-dark">
            {properties.label_fetched !== null
              ? truncateString(
                  `Fetched ${formatDuration(new Date(properties.label_fetched), new Date(), 1)} ago`,
                  20,
                )
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
              {dropdownMenuItems.map((item, id_) => (
                <ToolTip
                  infoIcon={false}
                  content={item.tooltip}
                  key={`menu-item-${id_}`}
                >
                  <button
                    onClick={() =>
                      deleteTrainingAreaMutation.mutate({ trainingAreaId: id })
                    }
                    className={` ${item.isDelete ? "text-primary bg-secondary" : "bg-off-white"}  w-8 h-8 p-1.5 items-center justify-center flex rounded-md`}
                    key={`dropdown-menu-item-${id_}`}
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
