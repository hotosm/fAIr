import { TrainingStatusBadge } from "@/components/shared/training-status-badge";
import { Button } from "@/components/ui/button";
import { ButtonVariant, DropdownPlacement, SHOELACE_SIZES } from "@/enums";
import { TOfflinePrediction } from "@/types";
import { formatDate, formatDuration, formatNumber } from "@/utils";
import { OfflinePredictionActions } from "./offline-predictions-actions";
import { MapIcon } from "@/components/ui/icons";

export const OfflinePredictionCard = ({
  predictionResult,
  handleTrainingLogsModal,
  handlePredictionResultModal,
}: {
  predictionResult: TOfflinePrediction;
  handleTrainingLogsModal: (taskId: string) => void;
  handlePredictionResultModal: (prediction: TOfflinePrediction) => void;
}) => {
  return (
    <div
      title={predictionResult.description as string}
      className={`relative flex min-h-48 w-full cursor-pointer  flex-col justify-between rounded-lg border border-gray-border bg-frosted-blue p-4 transition-colors  duration-150 hover:border-primary hover:shadow-sm`}
    >
      <div className="min-h-1/2 flex w-full flex-col gap-y-2">
        <div className="flex items-center justify-between gap-4">
          <h3 className="mb-0 flex min-h-16 items-center text-body-2 font-semibold text-gray-900">
            {!predictionResult.description
              ? `Untitled prediction ${predictionResult.id}`
              : predictionResult.description}
          </h3>
          <OfflinePredictionActions
            handlePredictionResultModal={handlePredictionResultModal}
            handleTrainingLogsModal={handleTrainingLogsModal}
            predictionResult={predictionResult}
            showSettingsInfo
            placement={DropdownPlacement.BOTTOM_START}
          />
        </div>
        <TrainingStatusBadge status={predictionResult.status} />
        <div className="mt-2 flex gap-x-4">
          <Button
            variant={ButtonVariant.TERTIARY}
            className="!w-fit"
            size={SHOELACE_SIZES.SMALL}
            uppercase={false}
          >
            <p>ID: {predictionResult.id}</p>
          </Button>
          <Button
            variant={ButtonVariant.DARK}
            className="!w-fit"
            size={SHOELACE_SIZES.SMALL}
            uppercase={false}
          >
            <p>Zoom: {predictionResult.config.zoom_level}</p>
          </Button>
        </div>
        <p className="text-body-3 text-dark">
          <MapIcon className="icon" />{" "}
          {formatNumber(predictionResult.result_count)} detected features
        </p>
        <p className="text-body-3 text-dark">
          Date Submitted:{" "}
          <span className="font-semibold">
            {predictionResult.created_at
              ? formatDate(predictionResult.created_at)
              : "-"}
          </span>
        </p>
        <p className="text-body-3 text-dark">
          Duration:{" "}
          <span className="font-semibold">
            {predictionResult.created_at && predictionResult.finished_at
              ? formatDuration(
                  new Date(predictionResult.finished_at),
                  new Date(predictionResult.created_at)
                )
              : "-"}
          </span>
        </p>
      </div>
    </div>
  );
};
