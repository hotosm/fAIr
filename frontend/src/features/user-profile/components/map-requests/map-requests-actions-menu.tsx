import { DropDown } from "@/components/ui/dropdown";
import { DropdownMenuItem } from "@/components/ui/dropdown/dropdown";
import { ElipsisIcon } from "@/components/ui/icons";
import { BASE_API_URL } from "@/config";
import { DropdownPlacement, PredictionRequestStatus } from "@/enums";
import useCopyToClipboard from "@/hooks/use-clipboard";
import { API_ENDPOINTS } from "@/services";
import { TOfflinePrediction } from "@/types";
import { downloadFileAs, showSuccessToast } from "@/utils";

type MapRequestsActionsMenuProps = {
  prediction: TOfflinePrediction;
  onCreateMapswipe?: (prediction: TOfflinePrediction) => void;
  onPublishResult?: (prediction: TOfflinePrediction) => void;
};

const hasResults = (prediction: TOfflinePrediction): boolean =>
  prediction.results_ready ||
  prediction.status?.toLowerCase() === PredictionRequestStatus.COMPLETED;

export const MapRequestsActionsMenu = ({
  prediction,
  onCreateMapswipe,
  onPublishResult,
}: MapRequestsActionsMenuProps) => {
  const { copyToClipboard } = useCopyToClipboard();

  const resultReady = hasResults(prediction);
  const resultLink =
    BASE_API_URL + API_ENDPOINTS.DOWNLOAD_PREDICTION_LABELS_FILE(prediction.id);

  const menuItems: DropdownMenuItem[] = [
    {
      label: "Download result",
      value: "download-result",
      disabled: !resultReady,
      onClick: () =>
        prediction.assets?.geojson &&
        downloadFileAs(
          prediction.assets.geojson,
          `prediction-${prediction.id}.geojson`,
        ),
    },
    {
      label: "Copy result link",
      value: "copy-result-link",
      disabled: !resultReady,
      onClick: async () => {
        await copyToClipboard(resultLink);
        showSuccessToast("Copied result link to clipboard.");
      },
    },
    ...(onCreateMapswipe
      ? [
          {
            label: prediction.mapswipe_project_id
              ? "View MapSwipe project"
              : "Create MapSwipe project",
            value: "mapswipe",
            disabled: !resultReady,
            onClick: () => onCreateMapswipe(prediction),
          },
        ]
      : []),
    {
      label: "Copy imagery link",
      value: "copy-imagery-link",
      onClick: async () => {
        await copyToClipboard(prediction.image_uri ?? "");
        showSuccessToast("Copied imagery link to clipboard.");
      },
    },
    ...(onPublishResult
      ? [
          {
            label: prediction.published ? "Retract result" : "Publish Result",
            value: "publish",
            disabled: !resultReady,
            onClick: () => onPublishResult(prediction),
          },
        ]
      : []),
  ];

  return (
    <DropDown
      placement={DropdownPlacement.BOTTOM_END}
      disableCheveronIcon
      hoist
      distance={8}
      className="text-left"
      triggerComponent={
        <span className="flex size-8 items-center justify-center rounded-[9.33px] bg-off-white text-dark">
          <ElipsisIcon className="size-4 rotate-90" />
        </span>
      }
      menuItems={menuItems}
    />
  );
};
