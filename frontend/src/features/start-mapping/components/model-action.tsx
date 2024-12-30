import { handleConflation, showErrorToast, showSuccessToast } from "@/utils";
import { Map } from "maplibre-gl";
import { START_MAPPING_PAGE_CONTENT, TOAST_NOTIFICATIONS } from "@/constants";
import { TModelPredictions } from "@/types";
import { TModelPredictionsConfig } from "@/features/start-mapping/api/get-model-predictions";
import { ToolTip } from "@/components/ui/tooltip";
import { useCallback } from "react";
import { useGetModelPredictions } from "@/features/start-mapping/hooks/use-model-predictions";

const ModelAction = ({
  setModelPredictions,
  modelPredictions,
  trainingConfig,
  map,
  disablePrediction,
}: {
  trainingConfig: TModelPredictionsConfig;
  modelPredictions: TModelPredictions;
  setModelPredictions: React.Dispatch<React.SetStateAction<TModelPredictions>>;
  map: Map | null;
  disablePrediction: boolean;
}) => {
  const modelPredictionMutation = useGetModelPredictions({
    mutationConfig: {
      onSuccess: (data) => {
        showSuccessToast(
          TOAST_NOTIFICATIONS.startMapping.modelPrediction.success,
        );
        const conflatedResults = handleConflation(
          modelPredictions,
          data.features,
          trainingConfig,
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
      <ToolTip
        content={
          disablePrediction ? START_MAPPING_PAGE_CONTENT.buttons.tooltip : null
        }
      >
        <button
          disabled={disablePrediction || modelPredictionMutation.isPending}
          onClick={handlePrediction}
          className={`w-full text-nowrap bg-primary px-3 py-3 md:py-1.5 rounded-md text-white ${disablePrediction || modelPredictionMutation.isPending ? "opacity-50" : ""}`}
        >
          <span className="capitalize text-sm">
            {" "}
            {modelPredictionMutation.isPending
              ? START_MAPPING_PAGE_CONTENT.buttons.predictionInProgress
              : START_MAPPING_PAGE_CONTENT.buttons.runPrediction}
          </span>
        </button>
      </ToolTip>
    </div>
  );
};

export default ModelAction;
