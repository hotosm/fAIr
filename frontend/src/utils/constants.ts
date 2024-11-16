/**
 * The navigation routes for the application. This object controls the name of the path. i.e  /<pathname>
 */

export const APPLICATION_ROUTES = {
  HOMEPAGE: "/",
  MODELS: "/models",
  MODEL_DETAILS: "/models/:id",
  // Model routes start
  CREATE_NEW_MODEL: "/models/new",
  CREATE_NEW_MODEL_TRAINING_DATASET: "/models/new/training-dataset",
  CREATE_NEW_MODEL_CONFIRMATION: "/models/new/confirmation",
  CREATE_NEW_MODEL_TRAINING_AREA: "/models/new/training-area",
  CREATE_NEW_MODEL_TRAINING_SETTINGS: "/models/new/training-settings",
  CREATE_NEW_MODEL_SUMMARY: "/models/new/model-summary",

  // Model routes end
  TRAINING_DATASETS: "/training-datasets",
  NOTFOUND: "/404",
  PRIVACY_POLICY: "/privacy",
  LEARN: "/learn",
  ABOUT: "/about",
  RESOURCES: "/resources",
  ACCOUNT_SETTINGS: "/account/settings",
  ACCOUNT_MODELS: "/account/models",
};

/**
 * The key used to store the access token in local storage for the application.
 */
export const HOT_FAIR_LOCAL_STORAGE_ACCESS_TOKEN_KEY: string =
  "___hot_fAIr_access_token";

/**
 * The key used to store the model creation state in local storage for the application.
 */
export const HOT_FAIR_MODEL_CREATION_LOCAL_STORAGE_KEY: string =
  "___hot_fAIr_model_form";

/**
 * The key used to store the redirect URL after login in session storage for the application.
 */
export const HOT_FAIR_SESSION_REDIRECT_KEY: string =
  "___hot_fAIr_redirect_after_login";

/**
 * The key used to indicate a successful login session for the application.
 */
export const HOT_FAIR_LOGIN_SUCCESSFUL_SESSION_KEY =
  "__hot_fair_login_successful";

/**
 * The maximum allowed area size (in square units) for training areas.
 */
export const MAX_TRAINING_AREA_SIZE = 5000000;

/**
 * The minimum allowed area size (in square units) for training areas.
 */
export const MIN_TRAINING_AREA_SIZE = 5797;

/**
 * The maximum file size (in bytes) allowed for training area upload.
 * This is set to 5 MB.
 */
export const MAX_TRAINING_AREA_UPLOAD_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

/**
 * The current version of the application.
 * This is used in the OSM redirect callback when a training area is opened in OSM. The idea is to add it to the hashtag for future tracking.
 * Todo - We need to find a way to make it dynamic.
 */
export const FAIR_VERSION = "v0.1";

/**
 * The maximum zoom level for the map.
 */
export const MAX_ZOOM_LEVEL = 22;

/**
 * The minimum zoom level to show the training area labels.
 */
export const TRAINING_LABELS_MIN_ZOOM_LEVEL = 18;

/**
 * Training area and labels styles.
 */
export const TRAINING_AREAS_AOI_FILL_COLOR = "#92B48766";
export const TRAINING_AREAS_AOI_OUTLINE_COLOR = "#92B48766";
export const TRAINING_AREAS_AOI_OUTLINE_WIDTH = 4;
export const TRAINING_AREAS_AOI_FILL_OPACITY = 0.4;
export const TRAINING_AREAS_AOI_LABELS_FILL_OPACITY = 0.3;
export const TRAINING_AREAS_AOI_LABELS_OUTLINE_WIDTH = 2
export const TRAINING_AREAS_AOI_LABELS_FILL_COLOR = "#D73434";
export const TRAINING_AREAS_AOI_LABELS_OUTLINE_COLOR = "#D73434";
