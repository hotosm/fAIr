import { SolidButton } from "@/components/shared/solid-button";
import { PredictionRequestStatus } from "@/enums";
import { useGetSinglePrediction } from "@/features/user-profile/hooks/use-predictions";
import { TOfflinePrediction } from "@/types";
import { cn, downloadFileAs, showErrorToast } from "@/utils";
import { useParams } from "react-router-dom";

const hasResults = (prediction?: TOfflinePrediction): boolean =>
  Boolean(
    prediction &&
      (prediction.results_ready ||
        prediction.status?.toLowerCase() === PredictionRequestStatus.COMPLETED),
  );

export const DownloadResultButton = ({
  className,
}: {
  className?: string;
}) => {
  const { id } = useParams();
  const { data: prediction } = useGetSinglePrediction(id);

  const geojsonUrl = prediction?.assets?.geojson;
  const resultReady = hasResults(prediction) && Boolean(geojsonUrl);

  const handleDownload = () => {
    if (!prediction || !geojsonUrl) {
      showErrorToast(undefined, "The result file isn't ready to download yet.");
      return;
    }
    // The asset is a presigned S3 URL served inline, so save it as a file
    // rather than opening it in a tab.
    downloadFileAs(geojsonUrl, `prediction-${prediction.id}.geojson`);
  };

  return (
    <SolidButton
      variant="primary"
      disabled={!resultReady}
      onClick={handleDownload}
      className={cn(
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
    >
      Download Result
    </SolidButton>
  );
};
