/**
 * This file contains the different types/schema for the API responses from the backend.
 */

// Auth and User types

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

// Model types
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

// Training types

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
// Training workspace

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

// Centroid types

export type Geometry = {
  type:
    | "Point"
    | "LineString"
    | "Polygon"
    | "MultiPoint"
    | "MultiLineString"
    | "MultiPolygon"
    | "GeometryCollection";
  coordinates: any;
};

export type Feature = {
  type: "Feature";
  geometry: Geometry;
  properties: {
    mid: string;
  };
};

export type FeatureCollection = {
  type: "FeatureCollection";
  features: Feature[];
};
