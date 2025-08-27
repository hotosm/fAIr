import { TrainingStatusBadge } from "@/components/shared/training-status-badge";
import { Button } from "@/components/ui/button";
import { ButtonVariant, DropdownPlacement, SHOELACE_SIZES } from "@/enums";
import { TOfflinePrediction } from "@/types";
import { formatDate, formatDuration, formatNumber } from "@/utils";

import { MapIcon } from "@/components/ui/icons";


import { OfflinePredictionActions } from "@/features/offline-predictions/components/offline-predictions-actions";

export const OfflinePredictionCard = ({
  predictionResult,
  handleTrainingLogsModal,
  handlePredictionResultModal,
  handleCreateOrViewMapSwipeProject,
}: {
  predictionResult: TOfflinePrediction;
  handleTrainingLogsModal: (taskId: string) => void;
  handlePredictionResultModal: (prediction: TOfflinePrediction) => void;
  handleCreateOrViewMapSwipeProject: (prediction: TOfflinePrediction) => void;
}) => {
  return (
    <div
      title={predictionResult.description as string}
      className={`w-full relative min-h-48 border border-gray-border  hover:shadow-sm bg-frosted-blue rounded-lg p-4 flex flex-col justify-between cursor-pointer  transition-colors duration-150 hover:border-primary`}
    >
      <div className="flex flex-col gap-y-2 min-h-1/2 w-full">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-body-2 font-semibold text-gray-900 min-h-16 flex items-center mb-0">
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
            handleCreateOrViewMapSwipeProject={
              handleCreateOrViewMapSwipeProject
            }
          />
        </div>
        <TrainingStatusBadge status={predictionResult.status} />
        <div className="flex gap-x-4 mt-2">
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
        <p className="text-dark text-body-3">
          <MapIcon className="icon" />{" "}
          {formatNumber(predictionResult.result_count)} detected features
        </p>
        <p className="text-dark text-body-3">
          Date Submitted:{" "}
          <span className="font-semibold">
            {predictionResult.created_at
              ? formatDate(predictionResult.created_at)
              : "-"}
          </span>
        </p>
        <p className="text-dark text-body-3">
          Duration:{" "}
          <span className="font-semibold">
            {predictionResult.created_at && predictionResult.finished_at
              ? formatDuration(
<<<<<<< HEAD
                new Date(predictionResult.finished_at),
                new Date(predictionResult.created_at),
              )
=======
                  new Date(predictionResult.finished_at),
                  new Date(predictionResult.created_at),
                )
>>>>>>> 7c4f2468 (feat: wip with mapswipe integration)
              : "-"}
          </span>
        </p>
      </div>
    </div>
  );
};
