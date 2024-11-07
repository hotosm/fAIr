/**
 * The navigation routes for the application. This object controls the name of the path. i.e  /<pathname>
 */

export const APPLICATION_ROUTES = {
  HOMEPAGE: "/",
  MODELS: "/models",
  MODEL_DETAILS: "/models/:id",
  // Model creation routes start
  CREATE_NEW_MODEL: "/models/new",
  CREATE_NEW_MODEL_TRAINING_DATASET: "/models/new/training-dataset",
  CREATE_NEW_MODEL_CONFIRMATION: "/models/new/confirmation",
  CREATE_NEW_MODEL_TRAINING_AREA: "/models/new/training-area",
  CREATE_NEW_MODEL_TRAINING_SETTINGS: "/models/new/training-settings",
  CREATE_NEW_MODEL_SUMMARY: "/models/new/model-summary",
  // Model creation routes end
  TRAINING_DATASETS: "/training-datasets",
  NOTFOUND: "/404",
  PRIVACY_POLICY: "/privacy",
  LEARN: "/learn",
  ABOUT: "/about",
  RESOURCES: "/resources",
  ACCOUNT_SETTINGS: "/account/settings",
  ACCOUNT_MODELS: "/account/models",
};

export const HOT_FAIR_LOCAL_STORAGE_ACCESS_TOKEN_KEY: string =
  "___hot_fAIr_access_token";

export const HOT_FAIR_MODEL_CREATION_LOCAL_STORAGE_KEY: string =
  "___hot_fAIr_model_creation_progress";

export const HOT_FAIR_SESSION_REDIRECT_KEY: string =
  "___hot_fAIr_redirect_after_login";

export const HOT_FAIR_LOGIN_SUCCESSFUL_SESSION_KEY =
  "__hot_fair_login_successful";
