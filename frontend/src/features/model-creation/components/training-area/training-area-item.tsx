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
  TRAINING_AREA_LABELS_FETCH_POOLING_TIME_MS,
  truncateString,
} from "@/utils";
import { TOAST_NOTIFICATIONS } from "@/constants";
import { ToolTip } from "@/components/ui/tooltip";
import { GeoJSONType, Geometry, TTrainingAreaFeature } from "@/types";
import {
  useCreateTrainingLabelsForAOI,
  useDeleteTrainingArea,
  useGetTrainingArea,
  useGetTrainingAreaLabels,
  useGetTrainingAreaLabelsFromOSM,
} from "@/features/model-creation/hooks/use-training-areas";
import { useModelsContext } from "@/app/providers/models-provider";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import FileUploadDialog from "@/features/model-creation/components/dialogs/file-upload-dialog";
import { useDialog } from "@/hooks/use-dialog";
import { geojsonToWKT } from "@terraformer/wkt";
import { Map } from "maplibre-gl";
import { LabelStatus } from "@/enums/training-area";
import { JOSMLogo, OSMLogo } from "@/assets/svgs";

type LabelState = {
  isFetching: boolean;
  error: boolean;
  fetchedDate: string;
  status: LabelStatus;
  timeSince: string;
  errorToastShown: boolean;
  shouldPoll: boolean;
};

export function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) return;
    const id = setInterval(() => savedCallback.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}

const TrainingAreaItem: React.FC<
  TTrainingAreaFeature & {
    datasetId: number;
    offset: number;
    map: Map | null;
  }
> = memo(({ datasetId, offset, map, ...trainingArea }) => {
  const initialLabelState: LabelState = {
    isFetching: false,
    error: false,
    fetchedDate: trainingArea?.properties?.label_fetched || "",
    status:
      trainingArea?.properties?.label_status || LabelStatus.NOT_DOWNLOADED,
    timeSince: "",
    errorToastShown: false,
    shouldPoll: false,
  };

  const [labelState, setLabelState] = useState<LabelState>(initialLabelState);
  const { onDropdownHide, onDropdownShow, dropdownIsOpened } =
    useDropdownMenu();
  const { isOpened, openDialog, closeDialog } = useDialog();
  const { formData } = useModelsContext();
  const pollingTimeoutRef = useRef<number>(0);

  const getTrainingAreaLabels = useGetTrainingAreaLabels(
    trainingArea.id,
    false,
  );
  const getTrainingArea = useGetTrainingArea(
    trainingArea.id,
    labelState.shouldPoll,
    TRAINING_AREA_LABELS_FETCH_POOLING_TIME_MS,
  );
  const createTrainingLabelsForAOI = useCreateTrainingLabelsForAOI({});

  useInterval(
    () => {
      if (labelState.shouldPoll) {
        getTrainingArea.refetch();
      }
    },
    labelState.shouldPoll ? TRAINING_AREA_LABELS_FETCH_POOLING_TIME_MS : null,
  );

  useEffect(() => {
    const updateTimeSince = () => {
      if (labelState.fetchedDate) {
        setLabelState((prev) => ({
          ...prev,
          timeSince: formatDuration(new Date(prev.fetchedDate), new Date(), 1),
        }));
      }
    };

    updateTimeSince();
    const intervalId = setInterval(
      updateTimeSince,
      TRAINING_AREA_LABELS_FETCH_POOLING_TIME_MS,
    );
    return () => clearInterval(intervalId);
  }, [labelState.fetchedDate]);

  useEffect(() => {
    if (!labelState.isFetching) return;

    const updateLabelStatus = () => {
      if (
        getTrainingArea.isError ||
        getTrainingArea.data?.properties.label_status ===
        LabelStatus.NOT_DOWNLOADED
      ) {
        handleLabelError();
      } else if (
        getTrainingArea.data?.properties.label_status === LabelStatus.DOWNLOADED
      ) {
        handleLabelSuccess(getTrainingArea.data.properties.label_fetched);
      } else {
        setLabelState((prev) => ({ ...prev, status: LabelStatus.DOWNLOADING }));
      }
    };

    updateLabelStatus();
  }, [labelState.isFetching, getTrainingArea]);

  const handleFetchLabels = useCallback(() => {
    setLabelState((prev) => ({
      ...prev,
      isFetching: true,
      error: false,
      shouldPoll: true,
    }));

    trainingAreaLabelsMutation.mutate(
      { aoiId: trainingArea.id },
      {
        onSettled: () => {
          setLabelState((prev) => ({ ...prev, isFetching: false }));
        },
        onError: handleLabelError,
      },
    );
  }, [trainingArea.id]);

  const handleLabelSuccess = (fetchedDate: string) => {
    setLabelState((prev) => ({
      ...prev,
      fetchedDate,
      status: LabelStatus.DOWNLOADED,
      isFetching: false,
      shouldPoll: false,
      errorToastShown: false,
      timeSince: fetchedDate
        ? formatDuration(new Date(fetchedDate), new Date(), 1)
        : "",
    }));
  };

  useEffect(() => {
    if (!labelState.isFetching) return;

    if (
      getTrainingArea.data?.properties.label_status === LabelStatus.DOWNLOADED
    ) {
      handleLabelSuccess(getTrainingArea.data.properties.label_fetched);
    }
  }, [getTrainingArea.data, labelState.isFetching]);

  useEffect(() => {
    if (labelState.shouldPoll) {
      const pollInterval = setInterval(() => {
        getTrainingArea.refetch();
      }, TRAINING_AREA_LABELS_FETCH_POOLING_TIME_MS);

      return () => clearInterval(pollInterval);
    }
  }, [labelState.shouldPoll, getTrainingArea]);

  const handleLabelError = () => {
    clearTimeout(pollingTimeoutRef.current);
    setLabelState((prev) => ({
      ...prev,
      isFetching: false,
      error: true,
      status: LabelStatus.NOT_DOWNLOADED,
      shouldPoll: false,
    }));

    if (!labelState.errorToastShown) {
      showErrorToast(
        undefined,
        `Could not fetch labels for AOI ${trainingArea.id}. Please retry.`,
      );
      setLabelState((prev) => ({ ...prev, errorToastShown: true }));
    }
  };

  const trainingAreaLabelsMutation = useGetTrainingAreaLabelsFromOSM({
    datasetId,
    offset,
    aoiId: trainingArea.id,
    mutationConfig: {
      onMutate: () => {
        setLabelState((prev) => ({
          ...prev,
          isFetching: true,
          error: false,
          status: LabelStatus.DOWNLOADING,
        }));
      },
      onSuccess: (data) => {
        showSuccessToast(`${data}`);
      },
      onError: handleLabelError,
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
      onError: (error) => showErrorToast(error),
    },
  });

  const handleFitToBounds = useCallback(() => {
    if (trainingArea.geometry) {
      const bounds = getGeoJSONFeatureBounds(trainingArea);
      map?.fitBounds(bounds, { padding: 20 });
    } else {
      showWarningToast(TOAST_NOTIFICATIONS.aoiWithoutGeometryWarning);
    }
  }, [map, trainingArea]);

  const handleFileUpload = async (geometry: Geometry) => {
    const wkt = geojsonToWKT(geometry as GeoJSONType);
    await createTrainingLabelsForAOI.mutateAsync({
      aoiId: trainingArea.id,
      geom: wkt,
    });
  };

  const dropdownMenuItems = [
    {
      tooltip: MODEL_CREATION_CONTENT.trainingArea.toolTips.openINJOSM,
      isIcon: false,
      imageSrc: JOSMLogo,
      onClick: () =>
        openInJOSM(formData.oamTileName, formData.tmsURL, [trainingArea]),
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
      onClick: () => {
        geoJSONDowloader(trainingArea, `AOI_${trainingArea.id}`);
        showSuccessToast(TOAST_NOTIFICATIONS.aoiDownloadSuccess);
        onDropdownHide();
      },
    },
    {
      tooltip: MODEL_CREATION_CONTENT.trainingArea.toolTips.downloadLabels,
      isIcon: true,
      Icon: CloudDownloadIcon,
      onClick: async () => {
        const res = await getTrainingAreaLabels.refetch();
        if (res.isSuccess) {
          geoJSONDowloader(res.data, `AOI_${trainingArea.id}_Labels`);
          onDropdownHide();
          showSuccessToast(TOAST_NOTIFICATIONS.aoiLabelsDownloadSuccess);
        }
        if (res.isError) showErrorToast(res.error);
      },
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
        deleteTrainingAreaMutation.mutate({
          trainingAreaId: trainingArea.id,
        }),
    },
  ]


  const trainingAreaSize = trainingArea.geometry
    ? formatAreaInAppropriateUnit(calculateGeoJSONArea(trainingArea))
    : "0 m²"

  const fetchStatusInfo = () => {
    if (labelState.isFetching || trainingAreaLabelsMutation.isPending) {
      return "Fetching labels...";
    }
    if (labelState.error) {
      return "Error occurred. Please retry.";
    }
    if (labelState.status === LabelStatus.DOWNLOADED) {
      return labelState.timeSince
        ? `Fetched ${labelState.timeSince} ago`
        : "Fetched recently";
    }
    return "No labels yet";
  }

  return (
    <>
      <FileUploadDialog
        disabled={createTrainingLabelsForAOI.isPending}
        isOpened={isOpened}
        closeDialog={closeDialog}
        label="Upload AOI Label(s)"
        fileUploadHandler={handleFileUpload}
        successToast={TOAST_NOTIFICATIONS.aoiLabelsUploadSuccess}
        disableFileSizeValidation
      />
      <div className="flex items-center justify-between w-full gap-x-4">
        <div className="flex flex-col gap-y-1">
          <p className="text-body-4 md:text-body-3">
            ID: <span className="font-semibold">{trainingArea.id}</span>
          </p>
          <p className="text-body-4 text-dark" title={trainingAreaSize}>
            Area: {truncateString(trainingAreaSize, 15)}
          </p>
          <p
            className={`text-body-4 text-dark ${labelState.status !== LabelStatus.DOWNLOADED && "text-primary"}`}
          >
            {fetchStatusInfo}
          </p>
        </div>
        <div className="flex items-center gap-x-3">
          <ToolTip
            content={
              MODEL_CREATION_CONTENT.trainingArea.toolTips.fetchOSMLabels
            }
          >
            <button
              disabled={
                trainingAreaLabelsMutation.isPending || labelState.isFetching
              }
              className="bg-green-secondary px-2 py-1 rounded-md text-nowrap text-[9px] flex items-center gap-x-2 font-light"
              onClick={handleFetchLabels}
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
              {dropdownMenuItems.map((item, idx) => (
                <ToolTip content={item.tooltip} key={`menu-item-${idx}`}>
                  <button
                    onClick={item.onClick}
                    className={`${item.isDelete ? "text-primary bg-secondary" : "bg-off-white"} w-8 h-8 p-1.5 items-center justify-center flex rounded-md`}
                  >
                    {item.isIcon ? (
                      // @ts-expect-error bad type definition
                      <item.Icon className="icon md:icon-lg" />
                    ) : (
                      <img
                        src={item.imageSrc}
                        className="icon md:icon-lg"
                        alt=""
                      />
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
});

export default TrainingAreaItem;
