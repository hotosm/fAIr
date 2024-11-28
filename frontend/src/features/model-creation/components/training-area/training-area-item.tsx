import { DropDown } from "@/components/ui/dropdown";
import {
  CloudDownloadIcon,
  DeleteIcon,
  ElipsisIcon,
  FullScreenIcon,
  MapIcon,
  UploadIcon,
} from "@/components/ui/icons";
import { useDropdownMenu } from "@/hooks/use-dropdown-menu";
import {
  calculateGeoJSONArea,
  formatAreaInAppropriateUnit,
  formatDuration,
  geoJSONDowloader,
  getGeoJSONFeatureBounds,
  MODEL_CREATION_CONTENT,
  openInIDEditor,
  openInJOSM,
  showErrorToast,
  showSuccessToast,
  showWarningToast,
  truncateString,
} from "@/utils";
import { TOAST_NOTIFICATIONS } from "@/contents";
import JOSMLogo from "@/assets/svgs/josm_logo.svg";
import OSMLogo from "@/assets/svgs/osm_logo.svg";
import { ToolTip } from "@/components/ui/tooltip";
import { BBOX, GeoJSONType, Geometry, TTrainingAreaFeature } from "@/types";
import {
  useCreateTrainingLabelsForAOI,
  useDeleteTrainingArea,
  useGetTrainingAreaLabels,
  useGetTrainingAreaLabelsFromOSM,
} from "@/features/model-creation/hooks/use-training-areas";
import { useMap } from "@/app/providers/map-provider";
import { useModelsContext } from "@/app/providers/models-provider";
import { useCallback, useEffect, useMemo, useState } from "react";
import FileUploadDialog from "../dialogs/file-upload-dialog";
import { useDialog } from "@/hooks/use-dialog";
import { geojsonToWKT } from "@terraformer/wkt";

const TrainingAreaItem: React.FC<
  TTrainingAreaFeature & { datasetId: number; offset: number }
> = ({ datasetId, offset, ...trainingArea }) => {
  const { onDropdownHide, onDropdownShow, dropdownIsOpened } =
    useDropdownMenu();
  const { formData } = useModelsContext();
  const [timeSinceLabelFetch, setTimeSinceLabelFetch] = useState("");
  const getTrainingAreaLabels = useGetTrainingAreaLabels(
    trainingArea.id,
    false,
  );
  const { map } = useMap();
  const { isOpened, openDialog, closeDialog } = useDialog();

  const trainingAreaLabelsMutation = useGetTrainingAreaLabelsFromOSM({
    datasetId,
    offset,
    aoiId: trainingArea.id,
    mutationConfig: {
      onSuccess: () => {
        showSuccessToast(TOAST_NOTIFICATIONS.trainingLabelsFetchSuccess);
      },
      onError: (error) => {
        showErrorToast(error);
      },
    },
  });

  const deleteTrainingAreaMutation = useDeleteTrainingArea({
    datasetId,
    offset,
    mutationConfig: {
      onSuccess: () => {
        showSuccessToast(TOAST_NOTIFICATIONS.trainingAreaDeletionSuccess);
        onDropdownHide();
      },
      onError: (error) => {
        showErrorToast(error);
      },
    },
  });

  const handleOpenInJOSM = useCallback(async () => {
    openInJOSM(
      formData.oamTileName,
      formData.tmsURL,
      formData.oamBounds as BBOX,
    );
  }, [formData.oamTileName, formData.tmsURL, formData.oamBounds]);

  const handleAOIDownload = useCallback(() => {
    geoJSONDowloader(trainingArea, `AOI_${trainingArea.id}`);
    showSuccessToast(TOAST_NOTIFICATIONS.aoiDownloadSuccess);
    onDropdownHide();
  }, [onDropdownHide, trainingArea]);

  const handleAOILabelsDownload = useCallback(async () => {
    const res = await getTrainingAreaLabels.refetch();
    if (res.isSuccess) {
      geoJSONDowloader(res.data, `AOI_${trainingArea.id}_Labels`);
      onDropdownHide();
      showSuccessToast(TOAST_NOTIFICATIONS.aoiLabelsDownloadSuccess);
    }
    if (res.isError) {
      showErrorToast(res.error);
    }
  }, [trainingArea]);

  const dropdownMenuItems = [
    {
      tooltip: MODEL_CREATION_CONTENT.trainingArea.toolTips.openINJOSM,
      isIcon: false,
      imageSrc: JOSMLogo,
      onClick: handleOpenInJOSM,
    },
    {
      tooltip: MODEL_CREATION_CONTENT.trainingArea.toolTips.openInIdEditor,
      isIcon: false,
      imageSrc: OSMLogo,
      onClick: () =>
        openInIDEditor(
          formData.oamBounds[1],
          formData.oamBounds[3],
          formData.oamBounds[0],
          formData.oamBounds[2],
          formData.tmsURL,
          formData.selectedTrainingDatasetId,
          trainingArea.id,
        ),
    },
    {
      tooltip: MODEL_CREATION_CONTENT.trainingArea.toolTips.downloadAOI,
      isIcon: true,
      Icon: CloudDownloadIcon,
      onClick: handleAOIDownload,
    },
    {
      tooltip: MODEL_CREATION_CONTENT.trainingArea.toolTips.downloadLabels,
      isIcon: true,
      Icon: CloudDownloadIcon,
      onClick: () => handleAOILabelsDownload(),
    },
    {
      tooltip: MODEL_CREATION_CONTENT.trainingArea.toolTips.uploadLabels,
      isIcon: true,
      Icon: UploadIcon,
      onClick: openDialog,
    },
    {
      tooltip: MODEL_CREATION_CONTENT.trainingArea.toolTips.deleteAOI,
      isIcon: true,
      Icon: DeleteIcon,
      isDelete: true,
      onClick: () =>
        deleteTrainingAreaMutation.mutate({ trainingAreaId: trainingArea.id }),
    },
  ];

  const handleFitToBounds = useCallback(() => {
    if (trainingArea.geometry) {
      const bounds = getGeoJSONFeatureBounds(trainingArea);
      map?.fitBounds(bounds, {
        padding: 20,
      });
    } else {
      showWarningToast(TOAST_NOTIFICATIONS.aoiWithoutGeometryWarning);
    }
  }, [map, trainingArea]);

  useEffect(() => {
    const updateTimeSinceFetch = () => {
      if (trainingArea?.properties?.label_fetched) {
        setTimeSinceLabelFetch(
          formatDuration(
            new Date(trainingArea.properties.label_fetched),
            new Date(),
            1,
          ),
        );
      }
    };

    updateTimeSinceFetch();
    const intervalId = setInterval(updateTimeSinceFetch, 10000);

    return () => clearInterval(intervalId);
  }, [trainingArea?.properties?.label_fetched]);

  const trainingAreaSize = useMemo(() => {
    return trainingArea.geometry
      ? formatAreaInAppropriateUnit(calculateGeoJSONArea(trainingArea))
      : "0 m²";
  }, [trainingArea]);

  const createTrainingLabelsForAOI = useCreateTrainingLabelsForAOI({});

  const fileUploadHandler = async (geometry: Geometry) => {
    const wkt = geojsonToWKT(geometry as GeoJSONType);
    createTrainingLabelsForAOI.mutate({ aoiId: trainingArea.id, geom: wkt });
  };

  return (
    <>
      <FileUploadDialog
        disabled={createTrainingLabelsForAOI.isPending}
        isOpened={isOpened}
        closeDialog={closeDialog}
        label={"Upload AOI Labels"}
        fileUploadHandler={fileUploadHandler}
        successToast={TOAST_NOTIFICATIONS.aoiLabelsUploadSuccess}
        disableFileSizeValidation
      />

      <div className="flex items-center justify-between w-full gap-x-4">
        <div className="flex flex-col gap-y-1">
          <p className="text-body-4 md:text-body-3 ">
            ID: <span className="font-semibold">{trainingArea.id}</span>
          </p>
          <p className="text-body-4 text-dark" title={`${trainingAreaSize}`}>
            Area: {truncateString(trainingAreaSize, 15)}
          </p>
          <p
            className={`text-body-4 text-dark ${trainingArea.properties.label_fetched === null && "text-primary"}`}
          >
            {trainingAreaLabelsMutation.isPending
              ? "Fetching labels..."
              : trainingArea.properties.label_fetched !== null
                ? truncateString(
                  `Fetched ${timeSinceLabelFetch === "0 sec" ? "just now" : `${timeSinceLabelFetch} ago`}`,
                  20,
                )
                : "No labels yet"}
          </p>
        </div>
        <div className="flex items-center gap-x-3">
          <ToolTip
            content={
              MODEL_CREATION_CONTENT.trainingArea.toolTips.fetchOSMLabels
            }
          >
            <button
              disabled={trainingAreaLabelsMutation.isPending}
              className="bg-green-secondary px-2 py-1 rounded-md text-nowrap text-[9px] flex items-center gap-x-2 font-light"
              onClick={() =>
                trainingAreaLabelsMutation.mutate({ aoiId: trainingArea.id })
              }
            >
              <MapIcon className="icon text-green-primary" />
            </button>
          </ToolTip>
          <ToolTip
            content={MODEL_CREATION_CONTENT.trainingArea.toolTips.zoomToAOI}
          >
            <button
              className="bg-off-white px-2 py-1 rounded-md"
              onClick={handleFitToBounds}
            >
              <FullScreenIcon className="icon" />
            </button>
          </ToolTip>
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
                <ToolTip content={item.tooltip} key={`menu-item-${id_}`}>
                  <button
                    onClick={() => item.onClick()}
                    className={` ${item.isDelete ? "text-primary bg-secondary" : "bg-off-white"}  w-8 h-8 p-1.5 items-center justify-center flex rounded-md`}
                    key={`dropdown-menu-item-${id_}`}
                  >
                    {item.isIcon ? (
                      // @ts-expect-error bad type definition
                      <item.Icon className="icon md:icon-lg" />
                    ) : (
                      <img src={item.imageSrc} className="icon md:icon-lg" />
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
