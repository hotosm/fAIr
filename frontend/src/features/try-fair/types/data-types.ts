import { BaseModelStacItem } from "@/features/try-fair/api/stac";

export type APIBaseModelUser = {
  osm_id: number;
  username: string;
};

export type APIBaseModelItem = {
  id: number;
  name: string;
  category: string;
  stac_item_id: string;
  status: string;
  visibility: string;
  is_pinned: boolean;
  star_count: number;
  is_starred: boolean;
  /** Try-now runs reported by the app. */
  prediction_runs?: number;
  map_request_count?: number;
  user_count?: number;
  feedback_count?: number;
  /** Base models only. */
  local_model_count?: number;
  error: string;
  user: APIBaseModelUser;
  created_at: string;
  last_modified: string;
  stac: BaseModelStacItem;
};

export type APIBaseModelsResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: APIBaseModelItem[];
};
export type FeatureToMapItem = {
  slug: string;
  id: number;
  description: string;
  last_modified: string;
  created_at: string;
  label: string;
};

export type FeaturesToMapResponse = {
  results: FeatureToMapItem[];
  count: number;
  next: string | null;
  previous: string | null;
};
