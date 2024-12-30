import axios from 'axios';
import { API_ENDPOINTS } from '@/services';
import { BBOX, FeatureCollection } from '@/types';

export type TModelPredictionsConfig = {
  area_threshold: number;
  bbox: BBOX;
  checkpoint: string;
  confidence: number;
  max_angle_change: number;
  model_id: string;
  skew_tolerance: number;
  source: string;
  tolerance: number;
  use_josm_q: boolean;
  zoom_level: number;
};

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
