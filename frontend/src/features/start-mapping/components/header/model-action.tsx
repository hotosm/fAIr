import { handleConflation, showErrorToast, showSuccessToast } from "@/utils";
import { Map } from "maplibre-gl";
import { START_MAPPING_PAGE_CONTENT, TOAST_NOTIFICATIONS } from "@/constants";
import {
  BBOX,
  TModelDetails,
  TModelPredictionFeature,
  TModelPredictionsConfig,
  TQueryParams,
} from "@/types";
import { ToolTip } from "@/components/ui/tooltip";
import { useCallback, useState } from "react";
import { useGetModelPredictions } from "@/features/start-mapping/hooks/use-model-predictions";
import { SEARCH_PARAMS } from "@/app/routes/start-mapping";
import { MIN_ZOOM_LEVEL_FOR_START_MAPPING_PREDICTION } from "@/config";
import { useParams } from "react-router-dom";
import { useMapStore } from "@/store/map-store";

const ModelAction = ({
  map,
  query,
  modelInfo,
  tileServerURL,
  predictionModelCheckpoint,
  modelPredictions,
  setModelPredictions,
  isOfflineMode = false,
  hasDrawnAOI = false,
  openOfflinePredictionRequestDialog,
}: {
  map: Map | null;
  query: TQueryParams;
  modelInfo: TModelDetails;
  tileServerURL: string | undefined;
  predictionModelCheckpoint: string;
  modelPredictions: TModelPredictionFeature[];
  setModelPredictions: (features: TModelPredictionFeature[]) => void;
  isOfflineMode?: boolean;
  hasDrawnAOI?: boolean;
  openOfflinePredictionRequestDialog?: () => void;
}) => {
  const { modelId } = useParams();
  const [predictionZoomLevel, setPredictionZoomLevel] = useState<number | null>(
    null
  );
  const currentZoom = useMapStore((state) => state.zoom);

  const getTrainingConfig = useCallback((): TModelPredictionsConfig => {
    return {
      tolerance: query[SEARCH_PARAMS.tolerance] as number,
      area_threshold: query[SEARCH_PARAMS.area] as number,
      orthogonalize: query[SEARCH_PARAMS.orthogonalize] as boolean,
      confidence: query[SEARCH_PARAMS.confidenceLevel] as number,
      checkpoint: predictionModelCheckpoint,
      ortho_max_angle_change_deg: query[SEARCH_PARAMS.maxAngleChange] as number,
      model_id: modelId as string,
      ortho_skew_tolerance_deg: query[SEARCH_PARAMS.skewTolerance] as number,
      source: tileServerURL ?? (modelInfo?.dataset?.source_imagery as string),
      zoom_level: predictionZoomLevel ?? currentZoom,
      bbox: [
        map?.getBounds().getWest(),
        map?.getBounds().getSouth(),
        map?.getBounds().getEast(),
        map?.getBounds().getNorth(),
      ] as BBOX,
    };
  }, [
    map,
    query,
    currentZoom,
    modelInfo,
    predictionZoomLevel,
    predictionModelCheckpoint,
    tileServerURL,
  ]);

  const modelPredictionMutation = useGetModelPredictions({
    mutationConfig: {
      onSuccess: (data) => {
        showSuccessToast(
          TOAST_NOTIFICATIONS.startMapping.modelPrediction.success
        );
        const conflatedResults = handleConflation(
          modelPredictions,
          data.features,
          {
            ...getTrainingConfig(),
            zoom_level: predictionZoomLevel ?? currentZoom,
          }
        );
        setModelPredictions(conflatedResults);
      },
      onError: (error) => showErrorToast(error),
    },
  });

  const handlePrediction = useCallback(async () => {
    if (!map) return;
    setPredictionZoomLevel(currentZoom);
    await modelPredictionMutation.mutateAsync(getTrainingConfig());
  }, [getTrainingConfig, modelPredictionMutation, map, currentZoom]);

  const disablePredictionButton =
    (currentZoom < MIN_ZOOM_LEVEL_FOR_START_MAPPING_PREDICTION ||
      modelPredictionMutation.isPending ||
      tileServerURL?.length === 0 ||
      predictionModelCheckpoint?.length === 0 ||
      isOfflineMode) &&
    !hasDrawnAOI;
  return (
    <div className="flex flex-col-reverse flex-wrap gap-y-3  md:flex-row md:flex-nowrap md:items-center md:justify-between md:gap-x-2">
      <ToolTip
        content={
          disablePredictionButton
            ? START_MAPPING_PAGE_CONTENT.buttons.tooltip
            : null
        }
      >
        <button
          disabled={disablePredictionButton}
          onClick={
            hasDrawnAOI ? openOfflinePredictionRequestDialog : handlePrediction
          }
          className={`w-full text-nowrap rounded-md bg-primary p-3 text-white md:py-1.5 ${disablePredictionButton ? "opacity-50" : ""}`}
        >
          <span className="text-body-4 capitalize">
            {modelPredictionMutation.isPending
              ? START_MAPPING_PAGE_CONTENT.buttons.predictionInProgress
              : isOfflineMode
                ? "Request offline prediction"
                : START_MAPPING_PAGE_CONTENT.buttons.runPrediction}
          </span>
        </button>
      </ToolTip>
    </div>
  );
};

export default ModelAction;
