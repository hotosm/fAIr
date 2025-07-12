import { Badge } from "@/components/ui/badge";
import { DropDown } from "@/components/ui/dropdown";
import { ElipsisIcon } from "@/components/ui/icons";
import { BASE_API_URL } from "@/config";
import { DropdownPlacement, ModelTrainingStatus } from "@/enums";
import useCopyToClipboard from "@/hooks/use-clipboard";
import { API_ENDPOINTS } from "@/services";
import { TOfflinePrediction } from "@/types";
import { showSuccessToast, showWarningToast } from "@/utils";
import { OfflinePredictionsSettingsInfo } from "./offline-predictions-settings-info";
import { useDropdownMenu } from "@/hooks/use-dropdown-menu";

export const OfflinePredictionActions = ({
  handlePredictionResultModal,
  handleTrainingLogsModal,
  predictionResult,
  showSettingsInfo = false,
  placement,
}: {
  handlePredictionResultModal: (prediction: TOfflinePrediction) => void;
  handleTrainingLogsModal: (taskId: string) => void;
  predictionResult: TOfflinePrediction;
  showSettingsInfo?: boolean;
  placement?: DropdownPlacement;
}) => {
  const { copyToClipboard } = useCopyToClipboard();
  const { dropdownRef } = useDropdownMenu();

  const handleSettingsInfo = () => {
    if (dropdownRef?.current) {
      dropdownRef.current.show();
    }
  };

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
            className="flex items-center rounded-lg px-2"
          >
            <ElipsisIcon className="icon rotate-90" />
          </Badge>
        }
        className="text-left"
        distance={10}
        menuItems={[
          {
            name: "Download results",
            value: "Download results",

            disabled: predictionResult.status !== ModelTrainingStatus.FINISHED,
            subMenuItems: [
              {
                name: "As Points",
                value: "As Points",
                onClick: (e) => {
                  e.stopPropagation();
                  const downloadUrl =
                    BASE_API_URL +
                    API_ENDPOINTS.DOWNLOAD_PREDICTION_RESULTS_POINTS_LABELS_FILE_(
                      predictionResult.id
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
                      predictionResult.id
                    );
                  window.open(downloadUrl, "_blank");
                },
              },
            ],
          },
          {
            name: "View results",
            value: "View results",
            onClick: (e) => {
              e.stopPropagation();
              handlePredictionResultModal(predictionResult);
            },
            disabled: predictionResult.status !== ModelTrainingStatus.FINISHED,
          },
          {
            name: "Copy results link",
            value: "Copy results link",
            onClick: async (e) => {
              e.stopPropagation();
              await copyToClipboard(
                BASE_API_URL +
                  API_ENDPOINTS.DOWNLOAD_PREDICTION_LABELS_FILE(
                    predictionResult.id
                  )
              );
              showSuccessToast("Copied results link to clipboard!");
            },
            disabled: predictionResult.status !== ModelTrainingStatus.FINISHED,
          },
          ...(showSettingsInfo
            ? [
                {
                  name: "View settings info",
                  value: "View settings info",
                  onClick: (e: { stopPropagation: () => void }) => {
                    e.stopPropagation();
                    handleSettingsInfo();
                  },
                },
              ]
            : []),
          {
            name: !predictionResult.mapswipe_id
              ? "Create MapSwipe project"
              : "View MapSwipe project",
            value: !predictionResult.mapswipe_id
              ? "Create MapSwipe project"
              : "View MapSwipe project",
            onClick: (e) => {
              e.stopPropagation();
              showWarningToast(
                "This feature is not yet implemented. Please check back later."
              );
            },
            disabled: predictionResult.status !== ModelTrainingStatus.FINISHED,
          },
          {
            name: "View logs",
            value: "View logs",
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
            name: "Copy imagery link",
            value: "Copy imagery link",
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
