import { ModelType, TileServiceType, TryFairMapOutputType, TryFairResolution } from "@/enums";
import { parseAsBoolean, parseAsFloat, parseAsString, useQueryStates } from "nuqs";
import { useStacBaseModels, useStacLocalModels } from "./use-base-models";
import { useMemo } from "react";
import { getSelectedModel } from "@/features/try-fair/utils/models";
import { getInferenceParams } from "@/features/try-fair/api/stac";

const VALID_OUTPUTS = Object.values(TryFairMapOutputType) as string[];
const VALID_RESOLUTIONS = Object.values(TryFairResolution) as string[];

/** Default values for all Try fAIr parameters. */
export const TRY_FAIR_PARAM_DEFAULTS = {
  model: "dinov3s-buildings",
  output: TryFairMapOutputType.POLYGON,
  resolution: TryFairResolution.LOW,
  confidence: 0.7,
  feature: "buildings",
  mode: ModelType.DEMO,
} as const;

/**
 * Persists the Try fAIr sidebar UI state in URL search params via nuqs.
 *
 * Params:
 *   model          — base model ID, e.g. "unet-segmentation"
 *   output         — visualization type: "polygon" | "points" | "cluster"
 *   resolution     — zoom resolution: "low" | "mid" | "high"
 *   confidence     — confidence threshold (0–1), e.g. 0.5
 *   feature        — selected feature category when mapping user-supplied imagery
 *   mode           — whether model demo imagery or user-selected imagery is active
 *   imagery        — custom imagery tile URL (never a bbox)
 *   imageryType    — selected custom imagery service type
 *   oamItem        — OpenAerialMap item ID; its URL and bbox are hydrated on load
 *   chooseLocation — boolean indicating whether the change location imagery modal is open
 */
export const useTryFairParams = () => {
  const [params, setParams] = useQueryStates(
    {
      model: parseAsString.withDefault(TRY_FAIR_PARAM_DEFAULTS.model),
      output: parseAsString.withDefault(TRY_FAIR_PARAM_DEFAULTS.output),
      resolution: parseAsString.withDefault(TRY_FAIR_PARAM_DEFAULTS.resolution),
      confidence: parseAsFloat,
      feature: parseAsString.withDefault(TRY_FAIR_PARAM_DEFAULTS.feature),
      mode: parseAsString.withDefault(TRY_FAIR_PARAM_DEFAULTS.mode),
      imagery: parseAsString,
      imageryType: parseAsString,
      oamItem: parseAsString,
      chooseLocation: parseAsBoolean.withDefault(false),
    },
    { history: "replace" },
  );

  const { models: allModels } = useStacBaseModels();
  const { models: localModels } = useStacLocalModels();

  const models = useMemo(() => [...allModels, ...localModels], [allModels, localModels]);

  const selectedModel = useMemo(
    () => getSelectedModel(models, params.model),
    [models, params.model],
  );

  const inferenceParams = useMemo(
    () => (selectedModel ? getInferenceParams(selectedModel) : []),
    [selectedModel],
  );

  const defaultConfidence = useMemo(() => {
    const confidenceParam = inferenceParams.find((param) => param.key === "confidence_threshold");
    if (confidenceParam && typeof confidenceParam.spec.default === "number") {
      return confidenceParam.spec.default;
    }
    return TRY_FAIR_PARAM_DEFAULTS.confidence;
  }, [inferenceParams]);

  const outputType = VALID_OUTPUTS.includes(params.output)
    ? (params.output as TryFairMapOutputType)
    : TryFairMapOutputType.POINTS;

  const resolution = VALID_RESOLUTIONS.includes(params.resolution)
    ? (params.resolution as TryFairResolution)
    : TryFairResolution.LOW;

  const confidence = params.confidence ?? defaultConfidence;

  const mode = params.mode === ModelType.IMAGERY ? ModelType.IMAGERY : ModelType.DEMO;

  const imageryTileServiceType = Object.values(TileServiceType).includes(
    params.imageryType as TileServiceType,
  )
    ? (params.imageryType as TileServiceType)
    : null;

  const isParametersDefault =
    resolution === TRY_FAIR_PARAM_DEFAULTS.resolution &&
    (params.confidence === null || params.confidence === defaultConfidence);

  const resetParameters = () =>
    setParams({
      resolution: TRY_FAIR_PARAM_DEFAULTS.resolution,
      confidence: defaultConfidence,
    });

  return {
    modelId: params.model,
    selectedModel,
    inferenceParams,
    outputType,
    resolution,
    confidence,
    feature: params.feature,
    mode,
    imageryUrl: params.imagery,
    imageryTileServiceType,
    oamItemId: params.oamItem,
    chooseLocation: params.chooseLocation,

    setModelId: (id: string) => setParams({ model: id }),
    setOutputType: (type: TryFairMapOutputType) => setParams({ output: type }),
    setResolution: (res: TryFairResolution) => setParams({ resolution: res }),
    setConfidence: (val: number | null) => setParams({ confidence: val }),
    setFeature: (feature: string) => setParams({ feature }),
    setMode: (mode: ModelType) => setParams({ mode }),
    setChooseLocation: (show: boolean) => setParams({ chooseLocation: show ? true : null }),
    setImagery: ({
      url,
      tileServiceType,
      oamItemId,
    }: {
      url: string | null;
      tileServiceType: TileServiceType | null;
      oamItemId: string | null;
    }) =>
      setParams({
        imagery: url,
        imageryType: tileServiceType,
        oamItem: oamItemId,
      }),

    isParametersDefault,
    resetParameters,
  };
};
