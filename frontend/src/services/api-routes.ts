/**
 * The backend API endpoints.
 */
export const API_ENDPOINTS = {
  // Auth
  LOGIN: "auth/login/",
  AUTH_CALLBACK: "auth/callback/",
  USER: "auth/me/",

  //KPIs

  GET_KPI_STATS: "kpi/stats/ ",

  //Models
  GET_MODELS: "model/",
  CREATE_MODELS: "model/",
  UPDATE_MODEL: (modelId: string) => `model/${modelId}/`,
  GET_MODEL_DETAILS: (id: string) => `model/${id}`,
  GET_MODELS_CENTROIDS: "models/centroid",

  //Trainings
  GET_TRAINING_DETAILS: (id: number) => `training/${id}`,
  GET_TRAINING_DATASETS: (searchQuery: string, ordering: string) =>
    `dataset/?search=${searchQuery}&ordering=${ordering}`,

  GET_TRAINING_DATASET: (id: number) => `dataset/${id}`,

  CREATE_TRAINING_DATASETS: "dataset/",
  GET_TRAINING_AREA_GPX: (aoiId: number) => `aoi/gpx/${aoiId}`,
  CREATE_TRAINING_AREA: "aoi/",
  CREATE_TRAINING_AREA_LABELS: (aoiId: number) => `label/osm/fetch/${aoiId}/`,

  GET_TRAINING_AREA_LABELS: (aoiId: number) => `label/?aoi=${aoiId}`,

  GET_TRAINING_DATASET_LABELS: (aoiDatasetId: number, bbox: string) =>
    `label/?aoi__dataset=${aoiDatasetId}&in__bbox=${bbox}/`,

  CREATE_TRAINING_REQUEST: "training/",

  DELETE_TRAINING_AREA: (id: number) => `aoi/${id}/`,

  GET_TRAINING_AREAS: (datasetId: number, offset: number, limit: number) =>
    `aoi/?dataset=${datasetId}&offset=${offset}&limit=${limit}`,

  GET_TRAINING_STATUS: (taskId: string) => `training/status/${taskId}`,
  UPDATE_TRAINING: (id: number) => `training/publish/${id}/`,
  GET_MODEL_TRAINING_HISTORY: (id: string) => `training/?model=${id}`,
  GET_TRAINING_FEEDBACKS: (trainingId: number) =>
    `feedback/?training=${trainingId}`,
  GET_TRAINING_WORKSPACE: (
    datasetId: number,
    trainingId: number,
    directory_name: string,
  ) =>
    `workspace/dataset_${datasetId}/output/training_${trainingId}/${directory_name}`,
  DOWNLOAD_TRAINING_FILE: (
    datasetId: number,
    trainingId: number,
    directory_name: string,
  ) =>
    `workspace/download/dataset_${datasetId}/output/training_${trainingId}/${directory_name}`,
};
