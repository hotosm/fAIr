import { ENVS } from "@/config/env";
import { StyleSpecification } from "maplibre-gl";

/**
 * The navigation routes for the application. This object controls the name of the path. i.e  /<pathname>
 */

export const MODELS_BASE = "/ai-models";

export const MODELS_ROUTES = {
  // Creation Routes
  CREATE_MODEL_BASE: `${MODELS_BASE}/new`,
  // Editing Routes
  EDIT_MODEL_BASE: `${MODELS_BASE}/:modelId`,
  DETAILS: "details",
  TRAINING_DATASET: "training-dataset",
  TRAINING_AREA: "training-area",
  TRAINING_SETTINGS: "training-settings",
  CONFIRMATION: "confirmation",
  MODEL_SUMMARY: "model-summary",
};

export const APPLICATION_ROUTES = {
  HOMEPAGE: "/",
  MODELS: MODELS_BASE,
  MODEL_DETAILS: `${MODELS_BASE}/:id`,

  // Model routes start

  CREATE_NEW_MODEL: `${MODELS_ROUTES.CREATE_MODEL_BASE}/${MODELS_ROUTES.DETAILS}`,
  CREATE_NEW_MODEL_TRAINING_DATASET: `${MODELS_ROUTES.CREATE_MODEL_BASE}/${MODELS_ROUTES.TRAINING_DATASET}`,
  CREATE_NEW_MODEL_CONFIRMATION: `${MODELS_ROUTES.CREATE_MODEL_BASE}/${MODELS_ROUTES.CONFIRMATION}`,
  CREATE_NEW_MODEL_TRAINING_AREA: `${MODELS_ROUTES.CREATE_MODEL_BASE}/${MODELS_ROUTES.TRAINING_AREA}`,
  CREATE_NEW_MODEL_TRAINING_SETTINGS: `${MODELS_ROUTES.CREATE_MODEL_BASE}/${MODELS_ROUTES.TRAINING_SETTINGS}`,
  CREATE_NEW_MODEL_SUMMARY: `${MODELS_ROUTES.CREATE_MODEL_BASE}/${MODELS_ROUTES.MODEL_SUMMARY}`,

  EDIT_MODEL_DETAILS: `${MODELS_ROUTES.EDIT_MODEL_BASE}/${MODELS_ROUTES.DETAILS}`,
  EDIT_MODEL_TRAINING_DATASET: `${MODELS_ROUTES.EDIT_MODEL_BASE}/${MODELS_ROUTES.TRAINING_DATASET}`,
  EDIT_MODEL_CONFIRMATION: `${MODELS_ROUTES.EDIT_MODEL_BASE}/${MODELS_ROUTES.CONFIRMATION}`,
  EDIT_MODEL_TRAINING_AREA: `${MODELS_ROUTES.EDIT_MODEL_BASE}/${MODELS_ROUTES.TRAINING_AREA}`,
  EDIT_MODEL_TRAINING_SETTINGS: `${MODELS_ROUTES.EDIT_MODEL_BASE}/${MODELS_ROUTES.TRAINING_SETTINGS}`,
  EDIT_MODEL_SUMMARY: `${MODELS_ROUTES.EDIT_MODEL_BASE}/${MODELS_ROUTES.MODEL_SUMMARY}`,

  // Model routes end
  TRAINING_DATASETS: "/training-datasets",
  START_MAPPING_BASE: "/start-mapping/",
  START_MAPPING: "/start-mapping/:modelId",
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
 * The maximum allowed area size (in square meters) for training areas.
 */
export const MAX_TRAINING_AREA_SIZE = ENVS.MAX_TRAINING_AREA_SIZE || 5000000;

/**
 * The minimum allowed area size (in square meters) for training areas.
 */
export const MIN_TRAINING_AREA_SIZE = ENVS.MIN_TRAINING_AREA_SIZE || 5797;

/**
 * The maximum file size (in bytes) allowed for training area upload.
 * The default is set to 5 MB.
 */
export const MAX_TRAINING_AREA_UPLOAD_FILE_SIZE =
  ENVS.MAX_TRAINING_AREA_UPLOAD_FILE_SIZE || 5 * 1024 * 1024;

/**
 * The current version of the application.
 * This is used in the OSM redirect callback when a training area is opened in OSM.
 */
export const FAIR_VERSION = ENVS.FAIR_VERSION || "v0.1";

/**
 * The current version of the application.
 * This is used in the OSM redirect callback when a training area is opened in OSM.
 */
export const OSM_HASHTAGS = ENVS.OSM_HASHTAGS || FAIR_VERSION;

/**
 * The maximum zoom level for the map.
 */
export const MAX_ZOOM_LEVEL = ENVS.MAX_ZOOM_LEVEL || 22;

/**
 * The minimum zoom level for the map before the prediction components can be activated.
 */
export const MIN_ZOOM_LEVEL_FOR_PREDICTION =
  ENVS.MIN_ZOOM_LEVEL_FOR_PREDICTION || 19;

/**
 * The instruction to show the users when they haven't reach the minimum zoom level on the start mapping page.
 */
export const MINIMUM_ZOOM_LEVEL_INSTRUCTION_FOR_PREDICTION = `Zoom in to at least zoom ${MIN_ZOOM_LEVEL_FOR_PREDICTION} to start mapping.`;

/**
 * A unique ID to append to all custom map sources and layers ids. This is useful for the legend component to dynamically get the layers on the map excluding the basemaps styles.
 */

export const MAP_STYLES_PREFIX = "fAIr";
/**
 * The minimum zoom level to show the training area labels.
 */
export const TRAINING_LABELS_MIN_ZOOM_LEVEL =
  ENVS.TRAINING_LABELS_MIN_ZOOM_LEVEL || 18;

// Layers, Sources and Name Mappings

export const TILE_BOUNDARY_LAYER_ID = `${MAP_STYLES_PREFIX}-tile-boundary-layer`;
export const TILE_BOUNDARY_SOURCE_ID = `${MAP_STYLES_PREFIX}-tile-boundaries`;
export const TMS_LAYER_ID = `${MAP_STYLES_PREFIX}-training-dataset-tms-layer`;
export const TMS_SOURCE_ID = `${MAP_STYLES_PREFIX}-oam-training-dataset`;
export const OSM_BASEMAP_LAYER_ID = `${MAP_STYLES_PREFIX}-osm-layer`;
export const GOOGLE_SATELLITE_BASEMAP_LAYER_ID = `${MAP_STYLES_PREFIX}-google-statellite-layer`;
export const GOOGLE_SATELLITE_BASEMAP_SOURCE_ID = `${MAP_STYLES_PREFIX}-google-satellite`;

// Model Predictions

// accepted

export const ACCEPTED_MODEL_PREDICTIONS_SOURCE_ID =
  "accepted-predictions-source";
export const ACCEPTED_MODEL_PREDICTIONS_FILL_LAYER_ID = `${MAP_STYLES_PREFIX}-accepted-predictions-fill-layer`;
export const ACCEPTED_MODEL_PREDICTIONS_OUTLINE_LAYER_ID =
  "accepted-predictions-outline-layer";

// all

export const ALL_MODEL_PREDICTIONS_SOURCE_ID = "all-predictions-source";
export const ALL_MODEL_PREDICTIONS_FILL_LAYER_ID = `${MAP_STYLES_PREFIX}-all-predictions-fill-layer`;
export const ALL_MODEL_PREDICTIONS_OUTLINE_LAYER_ID =
  "all-predictions-outline-layer";

// rejected
export const REJECTED_MODEL_PREDICTIONS_SOURCE_ID =
  "rejected-predictions-source";
export const REJECTED_MODEL_PREDICTIONS_FILL_LAYER_ID = `${MAP_STYLES_PREFIX}-rejected-predictions-fill-layer`;
export const REJECTED_MODEL_PREDICTIONS_OUTLINE_LAYER_ID =
  "rejected-predictions-outline-layer";

// Legend is only used on the start mapping page
// and only the fill layers are in the legend.

export const LEGEND_NAME_MAPPING: Record<string, string> = {
  [ALL_MODEL_PREDICTIONS_FILL_LAYER_ID]: "Map Result",
  [REJECTED_MODEL_PREDICTIONS_FILL_LAYER_ID]: "Rejected",
  [ACCEPTED_MODEL_PREDICTIONS_FILL_LAYER_ID]: "Accepted",
};

/**
 * Training area and labels styles.
 */
export const TRAINING_AREAS_AOI_FILL_COLOR =
  ENVS.TRAINING_AREAS_AOI_FILL_COLOR || "#92B48766";
export const TRAINING_AREAS_AOI_OUTLINE_COLOR =
  ENVS.TRAINING_AREAS_AOI_OUTLINE_COLOR || "#92B487";
export const TRAINING_AREAS_AOI_OUTLINE_WIDTH =
  ENVS.TRAINING_AREAS_AOI_OUTLINE_WIDTH || 4;
export const TRAINING_AREAS_AOI_FILL_OPACITY =
  ENVS.TRAINING_AREAS_AOI_FILL_OPACITY || 0.4;
export const TRAINING_AREAS_AOI_LABELS_FILL_OPACITY =
  ENVS.TRAINING_AREAS_AOI_LABELS_FILL_OPACITY || 0.3;
export const TRAINING_AREAS_AOI_LABELS_OUTLINE_WIDTH =
  ENVS.TRAINING_AREAS_AOI_LABELS_OUTLINE_WIDTH || 2;
export const TRAINING_AREAS_AOI_LABELS_FILL_COLOR =
  ENVS.TRAINING_AREAS_AOI_LABELS_FILL_COLOR || "#D73434";
export const TRAINING_AREAS_AOI_LABELS_OUTLINE_COLOR =
  ENVS.TRAINING_AREAS_AOI_LABELS_OUTLINE_COLOR || "#D73434";

/**
 * The key used to store the banner state in local storage for the application.
 */
export const HOT_FAIR_BANNER_LOCAL_STORAGE_KEY = "__hot_fair_banner_closed";

/**
 * The key used to store the model predictions in the session storage for the application.
 */
export const HOT_FAIR_MODEL_PREDICTIONS_SESSION_STORAGE_KEY =
  "__hot_fair_model_predictions";

// MAP SETTINGS

export const MAP_STYLES: Record<string, string | StyleSpecification> = {
  // ref - https://openfreemap.org/
  OSM: "https://tiles.openfreemap.org/styles/bright",
};



export const HOT_TRACKING_HTML_TAG_NAME = "hot-tracking";