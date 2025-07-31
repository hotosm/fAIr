import axios from "axios";
import { API_ENDPOINTS } from "@/services";
import { FeatureCollection } from "geojson";
import { TModelPredictionsConfig } from "@/types";

export const getModelPredictions = async ({
  area_threshold,
  bbox,
  checkpoint,
  confidence,
  ortho_max_angle_change_deg,
  model_id,
  ortho_skew_tolerance_deg,
  source,
  tolerance,
  orthogonalize,
  zoom_level,
}: TModelPredictionsConfig): Promise<FeatureCollection> => {
  return await (
    await axios.post(API_ENDPOINTS.GET_MODEL_PREDICTIONS, {
      area_threshold,
      bbox,
      checkpoint,
      confidence,
      ortho_max_angle_change_deg,
      model_id,
      ortho_skew_tolerance_deg,
      source,
      tolerance,
      orthogonalize,
      zoom_level,
    })
  ).data;
};
