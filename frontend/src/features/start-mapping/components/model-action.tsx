import { TModelPredictions } from "@/types";
import {
  MIN_ZOOM_LEVEL_FOR_PREDICTION,

  showErrorToast,
  showSuccessToast,
  uuid4,
} from "@/utils";
import { useGetModelPredictions } from "@/features/start-mapping/hooks/use-model-predictions";
import { Button } from "@/components/ui/button";
import { booleanIntersects } from "@turf/boolean-intersects";
import { APPLICATION_CONTENTS, TOAST_NOTIFICATIONS } from "@/contents";
import { useCallback } from "react";
import { useMap } from "@/app/providers/map-provider";
import { TModelPredictionsConfig } from "../api/get-model-predictions";

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

  const disablePredictionButton = currentZoom < MIN_ZOOM_LEVEL_FOR_PREDICTION;

  const modelPredictionMutation = useGetModelPredictions({
    mutationConfig: {
      onSuccess: (data) => {
        showSuccessToast(
          TOAST_NOTIFICATIONS.startMapping.modelPrediction.success,
        );

        /**
         * When a prediction is retrived from the backend and it hasn't been interacted with (i.e in the `all` array),
         * override it. But if it has been interacted with (i.e in either `rejected` or `accepted` array, leave it.)
         */

        const nonIntersectingFeatures = data.features.filter((newFeature) => {
          return (
            !modelPredictions.accepted.some((acceptedFeature) =>
              booleanIntersects(acceptedFeature, newFeature),
            ) &&
            !modelPredictions.rejected.some((rejectedFeature) =>
              booleanIntersects(rejectedFeature, newFeature),
            )
          );
        });

        setModelPredictions((prev) => ({
          ...prev,
          all: [
            ...nonIntersectingFeatures.map((feature) => ({
              ...feature,
              properties: {
                ...feature.properties,
                id: uuid4(), // Add unique ID for tracking
              },
            })),
          ],
        }));
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
      >
        {modelPredictionMutation.isPending
          ? APPLICATION_CONTENTS.START_MAPPING.buttons.predictionInProgress
          : APPLICATION_CONTENTS.START_MAPPING.buttons.runPrediction}
      </Button>
    </div>
  );
};

export default ModelAction;
