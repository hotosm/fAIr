import { Badge } from "@/components/ui/badge";
import { DropDown } from "@/components/ui/dropdown";
import { ElipsisIcon } from "@/components/ui/icons";
import { BASE_API_URL } from "@/config";
import { DropdownPlacement, ModelTrainingStatus } from "@/enums";
import useCopyToClipboard from "@/hooks/use-clipboard";
import { API_ENDPOINTS } from "@/services";
import { TOfflinePrediction } from "@/types";
import { showErrorToast, showSuccessToast } from "@/utils";
import { OfflinePredictionsSettingsInfo } from "@/features/user-profile/components/offline-predictions/offline-predictions-settings-info";
import { useDropdownMenu } from "@/hooks/use-dropdown-menu";
import {
  useRetryOfflinePrediction,
  useTerminateOfflinePrediction,
} from "@/features/user-profile/api/predictions";

export const OfflinePredictionActions = ({
  handlePredictionResultModal,
  handleTrainingLogsModal,
  predictionResult,
  showSettingsInfo = false,
  placement,
  handleCreateOrViewMapSwipeProject,
}: {
  handlePredictionResultModal: (prediction: any) => void;
  handleTrainingLogsModal: (taskId: string) => void;
  predictionResult: TOfflinePrediction;
  showSettingsInfo?: boolean;
  placement?: DropdownPlacement;
  handleCreateOrViewMapSwipeProject: (prediction: TOfflinePrediction) => void;
}) => {
  const { copyToClipboard } = useCopyToClipboard();
  const { dropdownRef } = useDropdownMenu();

  const handleSettingsInfo = () => {
    if (dropdownRef?.current) {
      dropdownRef.current.show();
    }
  };
  const { mutate: terminationMutation } = useTerminateOfflinePrediction({
    mutationConfig: {
      onSuccess: (data) => {
        showSuccessToast(data.data.detail);
      },
      onError: (err) => {
        showErrorToast(err);
      },
    },
    predictionId: Number(predictionResult.id),
  });

  const { mutate: retryMutation } = useRetryOfflinePrediction({
    mutationConfig: {
      onSuccess: (data) => {
        showSuccessToast(data.data.detail);
      },
      onError: (err) => {
        showErrorToast(err);
      },
    },
    predictionId: Number(predictionResult.id),
  });
  return (
    <>
      <OfflinePredictionsSettingsInfo
        disableSettingsInfoIcon
        predictionConfig={predictionResult.config}
        dropdownRef={dropdownRef}
        placement={placement}
      />

      <DropDown
        disableCheveronIcon
        triggerComponent={
          <Badge
            variant="default"
            onClick={(e) => {
              // Prevent the row click event from firing
              e.stopPropagation();
            }}
            className="rounded-lg px-2 items-center flex"
          >
            <ElipsisIcon className="icon rotate-90" />
          </Badge>
        }
        className="text-left"
        distance={10}
        menuItems={[
          ...(predictionResult.status === ModelTrainingStatus.RUNNING ||
          predictionResult.status === ModelTrainingStatus.SUBMITTED
            ? [
                {
                  name: "Cancel Prediction",
                  value: "Cancel Prediction",
                  onClick: (e: { stopPropagation: () => void }) => {
                    e.stopPropagation();
                    terminationMutation(predictionResult.id);
                  },
                },
              ]
            : []),

          ...(predictionResult.status === ModelTrainingStatus.FAILED
            ? [
                {
                  name: "Retry Prediction",
                  value: "Retry Prediction",
                  onClick: (e: { stopPropagation: () => void }) => {
                    e.stopPropagation();
                    retryMutation(predictionResult.id);
                  },
                },
              ]
            : []),
          {
            name: "Download Results",
            value: "Download Results",
            disabled:
              predictionResult.status !== ModelTrainingStatus.FINISHED ||
              predictionResult?.result?.count === 0,
            subMenuItems: [
              {
                name: "As Points",
                value: "As Points",
                onClick: (e) => {
                  e.stopPropagation();
                  const downloadUrl =
                    BASE_API_URL +
                    API_ENDPOINTS.DOWNLOAD_PREDICTION_RESULTS_POINTS_LABELS_FILE_(
                      predictionResult.id,
                    );
                  window.open(downloadUrl, "_blank");
                },
              },
              {
                name: "As Polygons",
                value: "As Polygons",
                onClick: (e) => {
                  e.stopPropagation();
                  const downloadUrl =
                    BASE_API_URL +
                    API_ENDPOINTS.DOWNLOAD_PREDICTION_LABELS_FILE(
                      predictionResult.id,
                    );
                  window.open(downloadUrl, "_blank");
                },
              },
            ],
          },
          {
            name: "View Results",
            value: "View Results",
            onClick: (e) => {
              e.stopPropagation();
              handlePredictionResultModal(predictionResult);
            },
            disabled:
              predictionResult.status !== ModelTrainingStatus.FINISHED ||
              predictionResult?.result?.count === 0,
          },
          {
            name: "Copy Results Link",
            value: "Copy Results Link",
            onClick: async (e) => {
              e.stopPropagation();
              await copyToClipboard(
                BASE_API_URL +
                  API_ENDPOINTS.DOWNLOAD_PREDICTION_LABELS_FILE(
                    predictionResult.id,
                  ),
              );
              showSuccessToast("Copied results link to clipboard!");
            },
            disabled:
              predictionResult.status !== ModelTrainingStatus.FINISHED ||
              predictionResult?.result?.count === 0,
          },
          ...(showSettingsInfo
            ? [
                {
                  name: "View Settings Info",
                  value: "View Settings Info",
                  onClick: (e: { stopPropagation: () => void }) => {
                    e.stopPropagation();
                    handleSettingsInfo();
                  },
                },
              ]
            : []),
          {
            name: !predictionResult.mapswipe_id
              ? "Create MapSwipe Project"
              : "View MapSwipe Project",
            value: !predictionResult.mapswipe_id
              ? "Create MapSwipe Project"
              : "View MapSwipe Project",
            onClick: (e) => {
              e.stopPropagation();
              handleCreateOrViewMapSwipeProject(predictionResult);
            },
            disabled:
              predictionResult.status !== ModelTrainingStatus.FINISHED ||
              predictionResult?.result?.count === 0,
          },
          {
            name: "View Logs",
            value: "View Logs",
            disabled: ![
              ModelTrainingStatus.FAILED,
              ModelTrainingStatus.IN_PROGRESS,
              ModelTrainingStatus.RUNNING,
            ].includes(predictionResult.status),
            onClick: (e) => {
              e.stopPropagation();
              handleTrainingLogsModal(predictionResult.task_id as string);
            },
          },
          {
            name: "Copy Imagery Link",
            value: "Copy Imagery Link",
            onClick: async (e) => {
              e.stopPropagation();
              await copyToClipboard(predictionResult.config.source);
              showSuccessToast("Copied imagery link to clipboard");
            },
          },
        ]}
      />
    </>
  );
};
