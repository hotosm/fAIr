import { TryFairMapOutputType, TryFairResolution } from "@/enums/try-fair";
import { parseAsFloat, parseAsString, useQueryStates } from "nuqs";

const VALID_OUTPUTS = Object.values(TryFairMapOutputType) as string[];
const VALID_RESOLUTIONS = Object.values(TryFairResolution) as string[];

/** Default values for all Try fAIr parameters. */
export const TRY_FAIR_PARAM_DEFAULTS = {
  model: "dinov3s-buildings",
  output: TryFairMapOutputType.POLYGON,
  resolution: TryFairResolution.LOW,
  confidence: 0.7,
} as const;

/**
 * Persists the Try fAIr sidebar UI state in URL search params via nuqs.
 *
 * Params:
 *   model      — base model ID, e.g. "unet-segmentation"
 *   output     — visualization type: "polygon" | "points" | "cluster"
 *   resolution — zoom resolution: "low" | "mid" | "high"
 *   confidence — confidence threshold (0–1), e.g. 0.5
 */
export const useTryFairParams = () => {
  const [params, setParams] = useQueryStates(
    {
      model: parseAsString.withDefault(TRY_FAIR_PARAM_DEFAULTS.model),
      output: parseAsString.withDefault(TRY_FAIR_PARAM_DEFAULTS.output),
      resolution: parseAsString.withDefault(TRY_FAIR_PARAM_DEFAULTS.resolution),
      confidence: parseAsFloat,
    },
    { history: "replace" },
  );

  const outputType = VALID_OUTPUTS.includes(params.output)
    ? (params.output as TryFairMapOutputType)
    : TryFairMapOutputType.POINTS;

  const resolution = VALID_RESOLUTIONS.includes(params.resolution)
    ? (params.resolution as TryFairResolution)
    : TryFairResolution.LOW;

  return {
    modelId: params.model,
    outputType,
    resolution,
    confidence: params.confidence,

    setModelId: (id: string) => setParams({ model: id }),
    setOutputType: (type: TryFairMapOutputType) => setParams({ output: type }),
    setResolution: (res: TryFairResolution) => setParams({ resolution: res }),
    setConfidence: (val: number | null) => setParams({ confidence: val }),
  };
};
