import { TModelPredictions } from "@/types";
import {
  handleConflation,
  MIN_ZOOM_LEVEL_FOR_START_MAPPING_PREDICTION,
  showErrorToast,
  showSuccessToast,
} from "@/utils";
import { useGetModelPredictions } from "@/features/start-mapping/hooks/use-model-predictions";
import { Button } from "@/components/ui/button";

import { APPLICATION_CONTENTS, TOAST_NOTIFICATIONS } from "@/contents";
import { useCallback } from "react";
import { useMap } from "@/app/providers/map-provider";
import { TModelPredictionsConfig } from "../api/get-model-predictions";
import { SHOELACE_SIZES } from "@/enums";

const ModelAction = ({
  setModelPredictions,
  modelPredictions,
  trainingConfig,
}: {
  trainingConfig: TModelPredictionsConfig;
  modelPredictions: TModelPredictions;
  setModelPredictions: React.Dispatch<React.SetStateAction<TModelPredictions>>;
}) => {
  const { map, currentZoom } = useMap();

  const disablePredictionButton = currentZoom < MIN_ZOOM_LEVEL_FOR_START_MAPPING_PREDICTION;

  const modelPredictionMutation = useGetModelPredictions({
    mutationConfig: {
      onSuccess: (data) => {
        showSuccessToast(
          TOAST_NOTIFICATIONS.startMapping.modelPrediction.success,
        );
        const conflatedResults = handleConflation(
          modelPredictions,
          data.features,
        );
        setModelPredictions(conflatedResults);
      },
      onError: (error) => showErrorToast(error),
    },
  });

  const handlePrediction = useCallback(async () => {
    if (!map) return;
    await modelPredictionMutation.mutateAsync(trainingConfig);
  }, [trainingConfig]);

  return (
    <div className="flex gap-y-3 flex-col-reverse flex-wrap  md:items-center md:flex-row md:justify-between md:gap-x-2 md:flex-nowrap">
      <Button
        disabled={disablePredictionButton || modelPredictionMutation.isPending}
        onClick={handlePrediction}
        className="!w-fit"
        size={SHOELACE_SIZES.MEDIUM}
        uppercase={false}
      >
        {modelPredictionMutation.isPending
          ? APPLICATION_CONTENTS.START_MAPPING.buttons.predictionInProgress
          : APPLICATION_CONTENTS.START_MAPPING.buttons.runPrediction}
      </Button>
    </div>
  );
};

export default ModelAction;
