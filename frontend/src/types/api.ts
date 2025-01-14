import { BBOX } from "./common";
import { GeoJsonProperties, Geometry } from "geojson";

/**
 * This file contains the different types/schema for the API responses from the backend.
 */

// Auth and User API response types

export type TLogin = {
  login_url: string;
};

export type TAuthenticate = {
  access_token: string;
};

export type TUser = {
  date_joined: string;
  email: string;
  img_url: string;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  osm_id: number;
  user_permission: [];
  username: string;
};

type TOSMUser = {
  date_joined: string;
  img_url: string;
  osm_id: number;
  username: string;
};

// Models API response types
export type TModel = {
  id: string;
  name: string;
  created_at: string;
  last_modified: string;
  published_training: number;
  status: number;
  dataset: number;
  accuracy: number;
  user: TOSMUser;
  thumbnail_url: string;
  base_model: string;
  description: string;
};

export type PaginatedModels = {
  count: number;
  next: string | null;
  previous: string | null;
  results: TModel[];
  hasNext: boolean;
  hasPrev: boolean;
};

export type PaginatedTrainings = {
  count: number;
  next: string | null;
  previous: string | null;
  results: TTrainingDetails[];
  hasNext: boolean;
  hasPrev: boolean;
};

export type TModelDetails = TModel & {
  description: string;
};

export type TTrainingAreaFeature = {
  type: "Feature";
  id: number;
  geometry: Geometry;
  properties: {
    created_at: string;
    label_fetched: string;
    label_status: number;
    last_modified: string;
    dataset: number;
  };
};

export type TTrainingArea = {
  type: "FeatureCollection";
  features: TTrainingAreaFeature[];
};

export type PaginatedTrainingArea = {
  count: number;
  next: string | null;
  previous: string | null;
  results: TTrainingArea;
  hasNext: boolean;
  hasPrev: boolean;
};

export type TTrainingDataset = {
  id: number;
  created_at: string;
  last_modified: string;
  name: string;
  status: number;
  user: number;
  source_imagery: string;
};

// Training API response types

export type TTrainingDetails = {
  id: number;
  multimasks: false;
  input_contact_spacing: number;
  input_boundary_width: number;
  source_imagery: null;
  description: string;
  created_at: string;
  status: string;
  task_id: null;
  zoom_level: [number, number, number];
  started_at: string;
  finished_at: string;
  accuracy: number;
  epochs: number;
  chips_length: number;
  batch_size: number;
  freeze_layers: boolean;
  model: number;
  created_by: number;
  user: TUser;
};

export type TTrainingStatus = {
  id: string;
  result: any;
  status: "PENDING";
  traceback: string;
};
// Training workspace API response types

export type TrainingWorkspace = {
  dir: Record<string, Record<string, number>>;
  file: Record<string, Record<string, number>>;
};
export type TTrainingFeedbacks = {
  count: number;
  next: string | null;
  previous: string | null;
  results: FeatureCollection;
};

// Centroid API response types

export type Feature = {
  type: "Feature";
  geometry: Geometry;
  properties:
    | {
        mid: string;
      }
    | GeoJsonProperties;
};

export type FeatureCollection = {
  type: "FeatureCollection";
  features: [] | Feature[];
};

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

export type TModelPredictionFeature = {
  type: "Feature";
  geometry: Geometry;
  properties: {
    id?: number | string;
    _id?: number | string;
    config: TModelPredictionsConfig;
  };
  id?: string | number;
};
