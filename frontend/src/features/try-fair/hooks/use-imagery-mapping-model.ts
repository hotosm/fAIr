import { ModelType } from "@/enums";
import {
  useGetAllAPIBaseModels,
  useGetAllAPILocalModels,
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
  allowUnpinned?: boolean;
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
  allowUnpinned = false,
}: UseImageryMappingModelOptions) => {
  const currentModelType = useStartMappingStore(
    (state) => state.currentModelType,
  );
  const isImageryMode = currentModelType === ModelType.IMAGERY;
  const pinnedBase = useGetAPIBaseModels(feature, isImageryMode);
  const pinnedLocal = useGetAPILocalModels(feature, isImageryMode);
  const pinnedModels = [
    ...(pinnedBase.data?.results ?? []),
    ...(pinnedLocal.data?.results ?? []),
  ];
  const pinnedModel =
    (selectedModelId
      ? pinnedModels.find((model) => model.stac_item_id === selectedModelId)
      : pinnedModels[0]) ?? (!allowUnpinned ? pinnedModels[0] : undefined);
  const needsUnpinnedModel =
    allowUnpinned && Boolean(selectedModelId) && !pinnedModel;
  const allBase = useGetAllAPIBaseModels(
    feature,
    isImageryMode && needsUnpinnedModel,
  );
  const allLocal = useGetAllAPILocalModels(
    feature,
    isImageryMode && needsUnpinnedModel,
  );
  const imageryModel =
    pinnedModel ??
    (allowUnpinned && selectedModelId
      ? [
          ...(allBase.data?.results ?? []),
          ...(allLocal.data?.results ?? []),
        ].find((model) => model.stac_item_id === selectedModelId)
      : null);
  const modelsReady =
    !isImageryMode ||
    Boolean(imageryModel) ||
    (needsUnpinnedModel
      ? allBase.isSuccess && allLocal.isSuccess
      : pinnedBase.isSuccess && pinnedLocal.isSuccess);

  const modelForMapping = isImageryMode
    ? (imageryModel?.stac ?? null)
    : selectedModel;
  const mappingModelId = isImageryMode
    ? (imageryModel?.stac_item_id ?? null)
    : (selectedModel?.id ?? null);
  const hasNoModelsForFeature = isImageryMode && modelsReady && !imageryModel;
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
    modelsReady,
    modelForMapping,
    mappingModelId,
    imageryModelId: isImageryMode ? mappingModelId : null,
    modelUri: modelForMapping?.assets.model?.href,
    hasNoModelsForFeature,
    inferenceParams,
    paramValues,
  };
};
