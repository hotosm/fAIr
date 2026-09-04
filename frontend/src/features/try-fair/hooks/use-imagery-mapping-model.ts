import { ModelType } from "@/enums";
import { useGetAPIBaseModels, useGetAPILocalModels } from "@/features/try-fair/api/features-to-map";
import { BaseModelStacItem, getInferenceParams } from "@/features/try-fair/api/stac";
import { useStartMappingStore } from "@/features/try-fair/utils/start-mapping-store";
import { useMemo } from "react";

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
  const currentModelType = useStartMappingStore((state) => state.currentModelType);
  const isImageryMode = currentModelType === ModelType.IMAGERY;
  const { data: apiBaseModels, isSuccess: hasLoadedApiBaseModels } = useGetAPIBaseModels(
    feature,
    isImageryMode,
  );
  const { data: apiLocalModels, isSuccess: hasLoadedApiLocalModels } = useGetAPILocalModels(
    feature,
    isImageryMode,
  );

  const imageryModel = useMemo(() => {
    const apiModels = [...(apiBaseModels?.results ?? []), ...(apiLocalModels?.results ?? [])];
    return apiModels[0]?.stac ?? null;
  }, [apiBaseModels, apiLocalModels]);
  const modelForMapping = isImageryMode ? imageryModel : selectedModel;
  // Some category API responses embed STAC metadata without the top-level
  // STAC `id`. `mlm:name` and the model asset URL are stable fallbacks used
  // only for client-side grid and input-change tracking.
  const mappingModelId =
    modelForMapping?.id ??
    modelForMapping?.properties["mlm:name"] ??
    modelForMapping?.assets.model?.href;
  const hasNoModelsForFeature =
    isImageryMode && hasLoadedApiBaseModels && hasLoadedApiLocalModels && imageryModel === null;
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
    modelUri: modelForMapping?.assets.model?.href,
    hasNoModelsForFeature,
    inferenceParams,
    paramValues,
  };
};
