import { useMutation } from "@tanstack/react-query";
import { BaseModelStacItem, runPredict } from "../api/stac";
import { TryFairResolution } from "@/enums/try-fair";
import { BBOX } from "@/types";
import { TRY_FAIR_RESOLUTION_ZOOM } from "@/features/try-fair/utils/common";
import { useCallback, useRef, useState } from "react";
export type PredictResult = {
  predictions: GeoJSON.FeatureCollection;
  bbox: BBOX;
  gridZoom: number;
  modelId: string;
  imageUri: string;
  resolution: TryFairResolution;
  params: Record<string, number | string | boolean>;
};

type PredictArgs = {
  /** STAC item — provides the inference endpoint URL. */
  model: BaseModelStacItem;
  modelUri: string;
  imageUri: string;
  bbox: BBOX;
  /** Exact tile zoom used to build the bbox from draggable grid tile boundaries. */
  gridZoom?: number;
  resolution: TryFairResolution;
  params: Record<string, number | string | boolean>;
};

export const useFairPredict = (initialResult: PredictResult | null = null) => {
  const abortControllerRef = useRef<AbortController | null>(null);
  const [result, setResult] = useState(initialResult);
  const { mutate, isPending, error, reset } = useMutation<
    PredictResult,
    Error,
    PredictArgs
  >({
    mutationFn: async ({
      model,
      modelUri,
      imageUri,
      bbox,
      gridZoom,
      resolution,
      params,
    }) => {
      const inferenceEndpoint = model.assets["mlm:inference-endpoint"]?.href;
      if (!inferenceEndpoint) {
        throw new Error("Selected model is missing an inference endpoint.");
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;
      try {
        const predictions = await runPredict(
          inferenceEndpoint,
          {
            model_uri: modelUri,
            image_uri: imageUri,
            bbox,
            zoom: gridZoom ?? TRY_FAIR_RESOLUTION_ZOOM[resolution],
            params,
          },
          controller.signal,
        );
        return {
          predictions,
          bbox,
          gridZoom: gridZoom ?? TRY_FAIR_RESOLUTION_ZOOM[resolution],
          modelId: model.id,
          imageUri,
          resolution,
          params,
        };
      } finally {
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
        }
      }
    },
    onSuccess: setResult,
  });

  const clearPredictions = useCallback(() => {
    setResult(null);
    reset();
  }, [reset]);

  return {
    predict: mutate,
    isPredicting: isPending,
    result,
    predictions: result?.predictions ?? null,
    predictionBBox: result?.bbox ?? null,
    predictionGridZoom: result?.gridZoom ?? null,
    error: error?.message ?? null,
    clearPredictions,
    cancelPrediction: () => abortControllerRef.current?.abort(),
  };
};
