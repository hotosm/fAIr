import axios from "axios";
import { BBOX } from "@/types";

// ── STAC types ────────────────────────────────────────────────────────────────

export type HyperParamSpec = {
  key: string;
  type: "float" | "int" | "str" | "bool";
  default: number | string | boolean;
  description: string;
  min?: number;
  max?: number;
  values?: string[];
};

export type BaseModelStacItem = {
  id: string;
  type: "Feature";
  properties: {
    title: string;
    description: string;
    deprecated: boolean;
    "mlm:name": string;
    "mlm:architecture": string;
    "mlm:tasks": string[];
    "mlm:framework": string;
    "mlm:hyperparameters": Record<string, string | number | boolean>;
    "fair:hyperparameters_spec": HyperParamSpec[];
    keywords: string[];
    providers: Array<{ name: string; description: string; url: string }>;
  };
  assets: {
    model: { href: string };
    "mlm:inference-endpoint": { href: string };
    [key: string]: { href: string; [k: string]: unknown };
  };
};

/** A single inference-time parameter resolved from the STAC item */
export type InferenceParam = {
  key: string;
  value: number | string | boolean;
  spec: HyperParamSpec;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Extract only the inference-time hyperparameters from a STAC base-model item.
 * Reads keys prefixed with "inference." from mlm:hyperparameters, then pairs
 * each with its entry in fair:hyperparameters_spec for min / max / default.
 */
export const getInferenceParams = (item: BaseModelStacItem): InferenceParam[] => {
  const hyper = item.properties["mlm:hyperparameters"];
  const specs = item.properties["fair:hyperparameters_spec"] ?? [];

  return Object.entries(hyper)
    .filter(([k]) => k.startsWith("inference."))
    .flatMap(([k, value]) => {
      const paramKey = k.replace("inference.", "");
      const spec = specs.find((s) => s.key === paramKey);
      if (!spec) return [];
      return [{ key: paramKey, value: value as number | string | boolean, spec }];
    });
};


export type PredictPayload = {
  model_uri: string;
  image_uri: string;
  bbox: BBOX;
  zoom: number;
  params: Record<string, number | string | boolean>;
};

/** POST to the model's mlm:inference-endpoint and return a GeoJSON FeatureCollection. */
export const runPredict = async (
  inferenceEndpoint: string,
  payload: PredictPayload,
): Promise<GeoJSON.FeatureCollection> => {
  const { data } = await axios.post(inferenceEndpoint, payload, {
    timeout: 300_000,
  });
  return data;
};
