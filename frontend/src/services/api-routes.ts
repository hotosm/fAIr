/**
 * The backend API endpoints.
 */
export const API_ENDPOINTS = {
  // Auth
  LOGIN: "auth/login/",
  AUTH_CALLBACK: "auth/callback/",
  USER: "auth/me/",

  //Models
  GET_MODELS: 'model/',
  GET_MODEL_DETAILS: (id: string) => `model/${id}`,
  GET_MODELS_CENTROIDS: 'models/centroid',

  //Trainings
  GET_TRAINING_DETAILS: (id: number) => `training/${id}`,
};
