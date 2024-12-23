/**
 * The backend API endpoints.
 */
export const API_ENDPOINTS = {
  // Auth

  LOGIN: "auth/login/",
  AUTH_CALLBACK: "auth/callback/",
  USER: "auth/me/",

  // OSM Database

  GET_OSM_DATABASE_LAST_UPDATED:
    "https://api-prod.raw-data.hotosm.org/v1/status/",

  // Predict

  GET_MODEL_PREDICTIONS: "https://predictor-dev.fair.hotosm.org/predict/",

  // Feedbacks

  CREATE_FEEDBACK: "feedback/",
  DELETE_FEEDBACK: (id: number) => `feedback/${id}/`,
  CREATE_APPROVED_PREDICTION: "approved-prediction/",
  DELETE_APPROVED_PREDICTION: (id: number) => `approved-prediction/${id}/`,

  // KPIs

  GET_KPI_STATS: "kpi/stats/ ",

  // GeoJSON to OSM

  GEOJSON_TO_OSM: "geojson2osm/",

  // Banner

  GET_BANNER: "banner",

  // Models

  GET_MODELS: "model/",
  CREATE_MODEL: "model/",
  UPDATE_MODEL: (modelId: string) => `model/${modelId}/`,
  GET_MODEL_DETAILS: (id: string) => `model/${id}`,
  GET_MODELS_CENTROIDS: "models/centroid",

  // Training Areas & Datasets

  GET_TRAINING_DETAILS: (id: number) => `training/${id}`,
  GET_TRAINING_DATASETS: (searchQuery: string, ordering: string) =>
    `dataset/?search=${searchQuery}&ordering=${ordering}`,
  GET_TRAINING_DATASET: (id: number) => `dataset/${id}`,
  GET_TRAINING_AREA_GPX: (aoiId: number) => `aoi/gpx/${aoiId}`,
  GET_TRAINING_AREA_LABELS_FROM_OSM: (aoiId: number) =>
    `label/osm/fetch/${aoiId}/`,
  GET_TRAINING_AREA_LABELS: (aoiId: number) => `label/?aoi=${aoiId}`,
  GET_TRAINING_DATASET_LABELS: (aoiDatasetId: number, bbox: string) =>
    `label/?aoi__dataset=${aoiDatasetId}&in__bbox=${bbox}/`,
  GET_TRAINING_AREAS: (datasetId: number, offset: number, limit: number) =>
    `aoi/?dataset=${datasetId}&offset=${offset}&limit=${limit}`,
  GET_TRAINING_AREA: (aoiId: number) => `aoi/${aoiId}/`,
  GET_TRAINING_STATUS: (taskId: string) => `training/status/${taskId}`,
  GET_MODEL_TRAINING_HISTORY: (id: string) => `training/?model=${id}`,
  GET_TRAINING_FEEDBACKS: (trainingId: number) =>
    `feedback/?training=${trainingId}`,
  CREATE_TRAINING_AREA_LABELS: `label/`,
  CREATE_TRAINING_DATASET: "dataset/",
  CREATE_TRAINING_AREA: "aoi/",
  CREATE_TRAINING_REQUEST: "training/",
  UPDATE_TRAINING: (id: number) => `training/publish/${id}/`,
  DELETE_TRAINING_AREA: (id: number) => `aoi/${id}/`,


  // Workspace

  GET_PMTILES_URL: (trainingAreaId: number) =>
    `/workspace/download/training_${trainingAreaId}/meta.pmtiles/?url_only=true`,

  GET_TRAINING_WORKSPACE: (trainingId: number, directory_name: string) =>
    `workspace/training_${trainingId}/${directory_name}`,
  DOWNLOAD_TRAINING_FILE: (trainingId: number, directory_name: string) =>
    `workspace/download/training_${trainingId}/${directory_name}/`,
};
