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
  GET_MODEL_DETAILS: (id: string) => `model/${id}`,
  GET_MODELS_CENTROIDS: "models/centroid",

  //Trainings
  GET_TRAINING_DETAILS: (id: number) => `training/${id}`,
  GET_TRAINING_DATASETS: "dataset/",
  CREATE_TRAINING_DATASETS: "dataset/",

  CREATE_TRAINING_AREA: "aoi/",

  DELETE_TRAINING_AREA: (id: number) => `aoi/${id}/`,

  GET_TRAINING_AREAS: (datasetId: number, offset: number, limit: number) =>
    `aoi/?dataset=${datasetId}&offset=${offset}&limit=${limit}`,

  GET_TRAINING_STATUS: (taskId: string) => `training/status/${taskId}`,
  UPDATE_TRAINING: (id: number) => `training/publish/${id}/`,
  GET_MODEL_TRAINING_HISTORY: (id: string) => `training/?model=${id}`,
  GET_TRAINING_FEEDBACKS: (trainingId: number) =>
    `/feedback/?training=${trainingId}`,
  GET_TRAINING_WORKSPACE: (
    datasetId: number,
    trainingId: number,
    directory_name: string,
  ) =>
    `/workspace/dataset_${datasetId}/output/training_${trainingId}/${directory_name}`,
  DOWNLOAD_TRAINING_FILE: (
    datasetId: number,
    trainingId: number,
    directory_name: string,
  ) =>
    `/workspace/download/dataset_${datasetId}/output/training_${trainingId}/${directory_name}`,
};
