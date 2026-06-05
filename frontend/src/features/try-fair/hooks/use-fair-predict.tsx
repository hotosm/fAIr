import { useMutation } from "@tanstack/react-query";
import { BaseModelStacItem, runPredict } from "../api/stac";
import { TryFairResolution } from "@/enums/try-fair";
import { BBOX } from "@/types";
import { TRY_FAIR_RESOLUTION_ZOOM } from "@/features/try-fair/utils/common";
type PredictResult = {
  predictions: GeoJSON.FeatureCollection;
  bbox: BBOX;
  gridZoom: number | undefined;
};

type PredictArgs = {
  /** Base model — provides the inference endpoint URL */
  model: BaseModelStacItem;
  localModelUri: string;
  tileServiceUrl: string;
  bbox: BBOX;
  /** Exact tile zoom used to build the bbox from draggable grid tile boundaries. */
  gridZoom?: number;
  resolution: TryFairResolution;
  params: Record<string, number | string | boolean>;
};

export const useFairPredict = () => {
  const { mutate, isPending, data, error, reset } = useMutation<
    PredictResult,
    Error,
    PredictArgs
  >({
    mutationFn: async ({
      model,
      localModelUri,
      tileServiceUrl,
      bbox,
      gridZoom,
      resolution,
      params,
    }) => {
      const inferenceEndpoint = model.assets["mlm:inference-endpoint"]?.href;
      if (!inferenceEndpoint) {
        throw new Error("Selected model is missing an inference endpoint.");
      }

      const predictions = await runPredict(inferenceEndpoint, {
        model_uri: localModelUri,
        image_uri: tileServiceUrl,
        bbox,
        zoom: gridZoom ?? TRY_FAIR_RESOLUTION_ZOOM[resolution],
        params,
      });
      return { predictions, bbox, gridZoom };
    },
  });

  return {
    predict: mutate,
    isPredicting: isPending,
    predictions: data?.predictions ?? null,
    predictionBBox: data?.bbox ?? null,
    predictionGridZoom: data?.gridZoom ?? null,
    error: error?.message ?? null,
    clearPredictions: reset,
  };
};
