import axios from "axios";
import { API_ENDPOINTS } from "@/services";
import { FeatureCollection } from "geojson";
import { TModelPredictionsConfig } from "@/types";

export const getModelPredictions = async ({
  area_threshold,
  bbox,
  checkpoint,
  confidence,
  max_angle_change,
  model_id,
  skew_tolerance,
  source,
  tolerance,
  use_josm_q,
  zoom_level,
}: TModelPredictionsConfig): Promise<FeatureCollection> => {
  return await (
    await axios.post(API_ENDPOINTS.GET_MODEL_PREDICTIONS, {
      area_threshold,
      bbox,
      checkpoint,
      confidence,
      max_angle_change,
      model_id,
      skew_tolerance,
      source,
      tolerance,
      use_josm_q,
      zoom_level,
    })
  ).data;
};
