import FileUploadDialog from '@/features/model-creation/components/dialogs/file-upload-dialog';
import { DropDown } from '@/components/ui/dropdown';
import { IconProps, TTrainingAreaFeature } from '@/types';
import { JOSMLogo, OSMLogo } from '@/assets/svgs';
import { LabelStatus } from '@/enums/training-area';
import { Map } from 'maplibre-gl';
import { ToolTip } from '@/components/ui/tooltip';
import {
  useCallback,
  useEffect,
  useRef,
  useState
} from 'react';
import { useDialog } from '@/hooks/use-dialog';
import { useDropdownMenu } from '@/hooks/use-dropdown-menu';
import { useModelsContext } from '@/app/providers/models-provider';
import {
  CloudDownloadIcon,
  DeleteIcon,
  ElipsisIcon,
  FullScreenIcon,
  MapIcon,
  UploadIcon,
} from "@/components/ui/icons";
import {
  calculateGeoJSONArea,
  formatAreaInAppropriateUnit,
  formatDuration,
  geoJSONDowloader,
  getGeoJSONFeatureBounds,
  openInIDEditor,
  openInJOSM,
  showErrorToast,
  showSuccessToast,
  showWarningToast,
  truncateString,
} from "@/utils";
import {
  MODELS_CONTENT,
  TOAST_NOTIFICATIONS,
  TRAINING_AREA_LABELS_FETCH_POOLING_TIME_MS,
} from "@/constants";
import {
  useCreateTrainingLabelsForAOI,
  useDeleteTrainingArea,
  useGetTrainingArea,
  useGetTrainingAreaLabels,
  useGetTrainingAreaLabelsFromOSM,
  useGetTrainingAreas,
} from "@/features/model-creation/hooks/use-training-areas";

type LabelState = {
  isFetching: boolean;
  error: boolean;
  fetchedDate: string;
  status: LabelStatus;
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

const LabelFetchStatus = ({
  fetchedDate,
  isFetching,
  isError,
  status,
}: {
  fetchedDate: string;
  isFetching: boolean;
  isError: boolean;
  status: LabelStatus;
}) => {
  const [timeSince, setTimeSince] = useState<string>("");

  useEffect(() => {
    const updateTimeSince = () => {
      setTimeSince(formatDuration(new Date(fetchedDate), new Date(), 1));
    };

    updateTimeSince();
    const intervalId = setInterval(
      updateTimeSince,
      TRAINING_AREA_LABELS_FETCH_POOLING_TIME_MS,
    );
    return () => clearInterval(intervalId);
  }, [fetchedDate]);

  const getFetchStatus = () => {
    if (isFetching) return "Fetching labels...";
    if (isError) return "Error occurred. Please retry.";
    if (status === LabelStatus.DOWNLOADED) {
      return timeSince ? `Labels fetched ${timeSince} ago` : "Labels fetched recently";
    }
    return "No labels yet";
  };

  return (
    <p
      className={`text-body-4 italic text-dark ${status !== LabelStatus.DOWNLOADED && "text-primary"}`}
    >
      {getFetchStatus()}
    </p>
  );
};
type TDropdownMenuItems = {
  tooltip: string;
  isIcon?: boolean;
  imageSrc?: string;
  disabled: boolean;
  onClick: () => void;
  Icon?: React.FC<IconProps>;
  isDelete?: boolean;
}[];

const DropdownMenu = ({
  dropdownMenuItems,
  dropdownIsOpened,
  onDropdownHide,
  onDropdownShow,
}: {
  dropdownMenuItems: TDropdownMenuItems;
  dropdownIsOpened: boolean;
  onDropdownHide: () => void;
  onDropdownShow: () => void;
}) => {
  return (
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
        {dropdownMenuItems.map((Item, idx) => (
          <ToolTip content={Item.tooltip} key={`menu-item-${idx}`}>
            <button
              onClick={Item.onClick}
              disabled={Item.disabled}
              className={`${Item.isDelete ? "text-primary bg-secondary" : "bg-off-white"} w-8 h-8 p-1.5 items-center justify-center flex rounded-md`}
            >
              {Item.isIcon ? (
                Item.Icon && <Item.Icon className="icon md:icon-lg" />
              ) : (
                <img
                  src={Item.imageSrc}
                  className="icon md:icon-lg"
                  alt={Item.tooltip}
                />
              )}
            </button>
          </ToolTip>
        ))}
      </div>
    </DropDown>
  );
};

export const TrainingAreaItem: React.FC<
  TTrainingAreaFeature & {
    datasetId: number;
    offset: number;
    map: Map | null;
  }
> = ({ datasetId, offset, map, ...trainingArea }) => {
  const initialLabelState: LabelState = {
    isFetching: false,
    error: false,
    fetchedDate: trainingArea?.properties?.label_fetched || "",
    status:
      trainingArea?.properties?.label_status || LabelStatus.NOT_DOWNLOADED,
    errorToastShown: false,
    shouldPoll: false,
  };

  const [labelState, setLabelState] = useState<LabelState>(initialLabelState);
  const { onDropdownHide, onDropdownShow, dropdownIsOpened } =
    useDropdownMenu();
  const { isOpened, openDialog, closeDialog } = useDialog();
  const { formData } = useModelsContext();

  const getTrainingAreaLabels = useGetTrainingAreaLabels(
    trainingArea.id,
    false,
  );

  const getTrainingArea = useGetTrainingArea(
    trainingArea.id,
    labelState.shouldPoll,
    TRAINING_AREA_LABELS_FETCH_POOLING_TIME_MS,
  );

  const handleLabelError = useCallback(() => {
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
  }, [labelState.errorToastShown, trainingArea.id]);

  const createTrainingLabelsForAOI = useCreateTrainingLabelsForAOI({
    mutationConfig: {
      onSuccess: (status) => {
        showSuccessToast(`${status}`);
        setLabelState((prev) => ({ ...prev, shouldPoll: true }));
      },
      onMutate: () => {
        setLabelState((prev) => ({
          ...prev,
          isFetching: true,
          error: false,
          status: LabelStatus.DOWNLOADING,
          errorToastShown: false,
        }));
      },
      onError: handleLabelError,
    },
  });

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
          errorToastShown: false,
        }));
      },
      onSuccess: (data) => {
        showSuccessToast(`${data}`);
        setLabelState((prev) => ({
          ...prev,
          shouldPoll: true,
        }));
      },
      onError: handleLabelError,
    },
  });

  const { refetch: refetchTrainingAreas } = useGetTrainingAreas(
    datasetId,
    offset,
  );

  const handleFetchLabels = useCallback(() => {
    setLabelState((prev) => ({
      ...prev,
      isFetching: true,
    }));
    trainingAreaLabelsMutation.mutate({ aoiId: trainingArea.id });
  }, [trainingAreaLabelsMutation]);

  const handleLabelSuccess = useCallback(
    (fetchedDate: string) => {
      setLabelState((prev) => ({
        ...prev,
        fetchedDate,
        status: LabelStatus.DOWNLOADED,
        isFetching: false,
        shouldPoll: false,
        errorToastShown: false,
      }));
      refetchTrainingAreas()
      showSuccessToast(
        `Training labels for Training Area ${trainingArea.id} have been successfully fetched.`,
      );
    },
    [setLabelState],
  );

  useEffect(() => {
    if (labelState.shouldPoll) {
      const pollInterval = setInterval(async () => {
        const res = await getTrainingArea.refetch();
        if (res.isSuccess) {
          const fetchedDate = res.data.properties.label_fetched;
          if (res.data?.properties.label_status === LabelStatus.DOWNLOADED) {
            handleLabelSuccess(fetchedDate);
          } else {
            setLabelState((prev) => ({
              ...prev,
              status: LabelStatus.DOWNLOADING,
            }));
          }
        } else {
          handleLabelError();
        }
      }, TRAINING_AREA_LABELS_FETCH_POOLING_TIME_MS);

      return () => clearInterval(pollInterval);
    }
  }, [labelState.shouldPoll, handleLabelSuccess]);

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

  const handleAOILabelsFileUpload = useCallback(
    async (formData: FormData) => {
      setLabelState((prev) => ({
        ...prev,
        isFetching: true,
      }));
      await createTrainingLabelsForAOI.mutateAsync({
        aoiId: trainingArea.id,
        formData: formData,
      });
    },
    [createTrainingLabelsForAOI, trainingArea.id],
  );

  const disableLabelsFetchOrUpload =
    trainingAreaLabelsMutation.isPending ||
    labelState.isFetching ||
    createTrainingLabelsForAOI.isPending ||
    labelState.shouldPoll;

  const dropdownMenuItems: TDropdownMenuItems = [
    {
      tooltip: MODELS_CONTENT.modelCreation.trainingArea.toolTips.openINJOSM,
      isIcon: false,
      imageSrc: JOSMLogo,
      disabled: false,
      onClick: () =>
        openInJOSM(formData.datasetName, formData.tmsURL, [trainingArea]),
    },
    {
      tooltip:
        MODELS_CONTENT.modelCreation.trainingArea.toolTips.openInIdEditor,
      isIcon: false,
      imageSrc: OSMLogo,
      disabled: false,
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
      tooltip: MODELS_CONTENT.modelCreation.trainingArea.toolTips.downloadAOI,
      isIcon: true,
      Icon: CloudDownloadIcon,
      disabled: false,
      onClick: () => {
        geoJSONDowloader(trainingArea, `AOI_${trainingArea.id}`);
        showSuccessToast(TOAST_NOTIFICATIONS.aoiDownloadSuccess);
        onDropdownHide();
      },
    },
    {
      tooltip:
        MODELS_CONTENT.modelCreation.trainingArea.toolTips.downloadLabels,
      isIcon: true,
      disabled: false,
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
      tooltip: disableLabelsFetchOrUpload
        ? MODELS_CONTENT.modelCreation.trainingArea.toolTips
          .labelsFetchInProgress
        : MODELS_CONTENT.modelCreation.trainingArea.toolTips.uploadLabels,
      isIcon: true,
      Icon: UploadIcon,
      onClick: openDialog,
      disabled: disableLabelsFetchOrUpload,
    },
    {
      tooltip: MODELS_CONTENT.modelCreation.trainingArea.toolTips.deleteAOI,
      isIcon: true,
      Icon: DeleteIcon,
      isDelete: true,
      disabled: false,
      onClick: () =>
        deleteTrainingAreaMutation.mutate({
          trainingAreaId: trainingArea.id,
        }),
    },
  ];

  const trainingAreaSize = trainingArea.geometry
    ? formatAreaInAppropriateUnit(calculateGeoJSONArea(trainingArea))
    : "0 m²";

  return (
    <>
      <FileUploadDialog
        disabled={createTrainingLabelsForAOI.isPending}
        isOpened={isOpened}
        closeDialog={closeDialog}
        label="Upload AOI Label(s)"
        rawFileUploadHandler={handleAOILabelsFileUpload}
        disableFileSizeValidation
        isAOILabelsUpload
      />
      <div className="flex items-center justify-between w-full gap-x-4">
        <div className="flex flex-col gap-y-1">
          <p className="text-body-4 md:text-body-3">
            ID: <span className="font-semibold">{trainingArea.id}</span>
          </p>
          <p className="text-body-4 text-dark" title={trainingAreaSize}>
            Area: {truncateString(trainingAreaSize, 15)}
          </p>
          <LabelFetchStatus
            fetchedDate={labelState.fetchedDate}
            isError={labelState.error}
            status={labelState.status}
            isFetching={labelState.isFetching}
          />
        </div>
        <div className="flex items-center gap-x-3">
          <ToolTip
            content={
              disableLabelsFetchOrUpload
                ? MODELS_CONTENT.modelCreation.trainingArea.toolTips
                  .labelsFetchInProgress
                : MODELS_CONTENT.modelCreation.trainingArea.toolTips
                  .fetchOSMLabels
            }
          >
            <button
              disabled={disableLabelsFetchOrUpload}
              className="bg-green-secondary px-2 py-1 rounded-md text-nowrap text-[9px] flex items-center gap-x-2 font-light"
              onClick={handleFetchLabels}
            >
              <MapIcon className="icon md:icon-lg text-green-primary" />
            </button>
          </ToolTip>
          <ToolTip
            content={
              MODELS_CONTENT.modelCreation.trainingArea.toolTips.zoomToAOI
            }
          >
            <button
              className="bg-off-white px-2 py-1 rounded-md"
              onClick={handleFitToBounds}
            >
              <FullScreenIcon className="icon" />
            </button>
          </ToolTip>
          <DropdownMenu
            dropdownMenuItems={dropdownMenuItems}
            dropdownIsOpened={dropdownIsOpened}
            onDropdownHide={onDropdownHide}
            onDropdownShow={onDropdownShow}
          />
        </div>
      </div>
    </>
  );
};
