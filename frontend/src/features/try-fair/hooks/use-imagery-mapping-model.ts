import { ModelType } from "@/enums";
import {
  useGetAPIBaseModels,
  useGetAPILocalModels,
} from "@/features/try-fair/api/features-to-map";
import {
  getInferenceParams,
  type BaseModelStacItem,
} from "@/features/try-fair/api/stac";
import { useStartMappingStore } from "@/features/try-fair/utils/start-mapping-store";
import { useMemo } from "react";

type UseImageryMappingModelOptions = {
  feature: string;
  confidence: number;
  selectedModel: BaseModelStacItem | null;
  /** The stac_item_id of the model explicitly chosen by the user (from the advanced picker). */
  selectedModelId?: string | null;
};

/**
 * Resolves the model used for a mapping run.
 *
 * Imagery mode: if the user has explicitly selected a model via the advanced
 * picker (selectedModelId), that model is used; otherwise falls back to the
 * first compatible model returned by the category APIs.
 * Demo mode: uses the model selected from the STAC catalogue.
 */
export const useImageryMappingModel = ({
  feature,
  confidence,
  selectedModel,
  selectedModelId,
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
    return (
      apiModels.find((model) => model.stac_item_id === selectedModelId) ??
      apiModels[0] ??
      null
    );
  }, [apiBaseModels, apiLocalModels, selectedModelId]);

  const modelForMapping = isImageryMode
    ? (imageryModel?.stac ?? null)
    : selectedModel;
  const mappingModelId = isImageryMode
    ? (imageryModel?.stac_item_id ?? null)
    : (selectedModel?.id ?? null);
  const hasNoModelsForFeature =
    isImageryMode &&
    hasLoadedApiBaseModels &&
    hasLoadedApiLocalModels &&
    imageryModel === null;
  const inferenceParams = useMemo(
    () => (modelForMapping ? getInferenceParams(modelForMapping) : []),
    [modelForMapping],
  );
  const paramValues = useMemo(() => {
    const values: Record<string, number | string | boolean> = {
      confidence_threshold: confidence,
    };
    inferenceParams.forEach(({ key, spec }) => {
      if (key !== "confidence_threshold") {
        values[key] = spec.default;
      }
    });
    return values;
  }, [confidence, inferenceParams]);

  return {
    modelForMapping,
    mappingModelId,
    imageryModelId: isImageryMode ? mappingModelId : null,
    modelUri: modelForMapping?.assets.model?.href,
    hasNoModelsForFeature,
    inferenceParams,
    paramValues,
  };
};
