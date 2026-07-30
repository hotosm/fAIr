import { ModelType } from "@/enums";
import {
  useGetAPIBaseModels,
  useGetAPILocalModels,
} from "@/features/try-fair/api/features-to-map";
import {
  BaseModelStacItem,
  getInferenceParams,
} from "@/features/try-fair/api/stac";
import { useStartMappingStore } from "@/features/try-fair/utils/start-mapping-store";
import { showWarningToast } from "@/utils";
import { useEffect, useMemo, useRef } from "react";

type UseImageryMappingModelOptions = {
  feature: string;
  confidence: number;
  selectedModel: BaseModelStacItem | null;
};

/**
 * Resolves the model used for a mapping run.
 *
 * Imagery mode uses the first compatible model returned by the category APIs;
 * demo mode continues to use the model selected from the STAC catalogue.
 */
export const useImageryMappingModel = ({
  feature,
  confidence,
  selectedModel,
}: UseImageryMappingModelOptions) => {
  const currentModelType = useStartMappingStore(
    (state) => state.currentModelType,
  );
  const isImageryMode = currentModelType === ModelType.IMAGERY;
  const { data: apiBaseModels, isSuccess: hasLoadedApiBaseModels } =
    useGetAPIBaseModels(feature, isImageryMode);
  const { data: apiLocalModels, isSuccess: hasLoadedApiLocalModels } =
    useGetAPILocalModels(feature, isImageryMode);

  const imageryModel = useMemo(() => {
    const apiModels = [
      ...(apiBaseModels?.results ?? []),
      ...(apiLocalModels?.results ?? []),
    ];
    return apiModels[0]?.stac ?? null;
  }, [apiBaseModels, apiLocalModels]);

  const modelForMapping = isImageryMode ? imageryModel : selectedModel;
  const hasNoModelsForFeature =
    isImageryMode &&
    hasLoadedApiBaseModels &&
    hasLoadedApiLocalModels &&
    imageryModel === null;
  const noModelsToastFeatureRef = useRef<string | null>(null);

  useEffect(() => {
    noModelsToastFeatureRef.current = null;
  }, [feature]);

  useEffect(() => {
    if (!hasNoModelsForFeature || noModelsToastFeatureRef.current === feature) {
      return;
    }

    showWarningToast(`No models are available for mapping ${feature}.`);
    noModelsToastFeatureRef.current = feature;
  }, [feature, hasNoModelsForFeature]);

  const inferenceParams = useMemo(
    () => (modelForMapping ? getInferenceParams(modelForMapping) : []),
    [modelForMapping],
  );
  const paramValues = useMemo(() => {
    const values: Record<string, number | string | boolean> = {};
    inferenceParams.forEach(({ key, spec }) => {
      values[key] = key === "confidence_threshold" ? confidence : spec.default;
    });
    return values;
  }, [confidence, inferenceParams]);

  return {
    modelForMapping,
    mappingModelId: modelForMapping?.id,
    modelUri: modelForMapping?.assets.model?.href,
    hasNoModelsForFeature,
    inferenceParams,
    paramValues,
  };
};
