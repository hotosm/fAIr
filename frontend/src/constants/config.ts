import { BASE_MODELS } from '@/enums';
import { ENVS } from '@/config/env';
import { StyleSpecification } from 'maplibre-gl';

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
 * Configuration for KPI Statistics Refetching Interval.
 */

// Default cache time in seconds (15 minutes)
const DEFAULT_KPI_STATS_CACHE_TIME_SECONDS = 900;

// Buffer time in milliseconds (1 second)
const REFRESH_BUFFER_MS = 1000;

/**
 * The cache time to poll the backend for updated KPI statistics, in milliseconds.
 * It includes an additional buffer to ensure fresh data retrieval.
 *
 * @type {number}
 */
export const KPI_STATS_CACHE_TIME_MS =
  (Number(ENVS.KPI_STATS_CACHE_TIME) || DEFAULT_KPI_STATS_CACHE_TIME_SECONDS) *
  1000 +
  REFRESH_BUFFER_MS;

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
export const MIN_ZOOM_LEVEL_FOR_START_MAPPING_PREDICTION =
  ENVS.MIN_ZOOM_LEVEL_FOR_START_MAPPING_PREDICTION || 19;

/**
 * The instruction to show the users when they haven't reach the minimum zoom level on the start mapping page.
 */
export const MINIMUM_ZOOM_LEVEL_INSTRUCTION_FOR_PREDICTION = `Zoom in to at least zoom ${MIN_ZOOM_LEVEL_FOR_START_MAPPING_PREDICTION} to start mapping.`;

/**
 * A unique ID to append to all custom map sources and layers ids. This is useful for the legend component to dynamically get the layers on the map excluding the basemaps styles.
 */

export const MAP_STYLES_PREFIX = "fAIr";
/**
 * The minimum zoom level to show the training area labels.
 */
export const MIN_ZOOM_LEVEL_FOR_TRAINING_AREA_LABELS =
  ENVS.MIN_ZOOM_LEVEL_FOR_TRAINING_AREA_LABELS || 18;

// Layers, Sources and Name Mappings

export const TILE_BOUNDARY_LAYER_ID = `${MAP_STYLES_PREFIX}-tile-boundary-layer`;
export const TILE_BOUNDARY_SOURCE_ID = `${MAP_STYLES_PREFIX}-tile-boundaries`;
export const TMS_LAYER_ID = `${MAP_STYLES_PREFIX}-oam-tms-layer`;
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
  ENVS.TRAINING_AREAS_AOI_FILL_COLOR || "#247DCACC";
export const TRAINING_AREAS_AOI_OUTLINE_COLOR =
  ENVS.TRAINING_AREAS_AOI_OUTLINE_COLOR || "#247DCACC";
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
 * The key used to store the model form data in session storage to preserve the state incase the user
 * visits ID Editor or JOSM to map a training area.
 * Session storage is used to allow users to be able to open fAIr on a new tab and start on a clean slate.
 */
export const HOT_FAIR_MODEL_CREATION_SESSION_STORAGE_KEY = "__hot_fair_model_creation_formdata";


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

/**
 * The web component tag name used in `hotosm/ui` for the tracking component.
 */
export const HOT_TRACKING_HTML_TAG_NAME = "hot-tracking";

/**
 * The file extension for the prediction api.
 */

export const PREDICTION_API_FILE_EXTENSIONS = {
  [BASE_MODELS.RAMP]: ".tflite",
  [BASE_MODELS.YOLOV8_V1]: ".onnx",
  [BASE_MODELS.YOLOV8_V2]: ".onnx",
};

/**
 * The remote url to JOSM.
 */
export const JOSM_REMOTE_URL = ENVS.JOSM_REMOTE_URL || "http://127.0.0.1:8111/";

/**
 * The time to poll the backend for the status of the AOI training labels fetching, in milliseconds (ms).
 * Defaults to 5000 ms (5 seconds).
 */
export const TRAINING_AREA_LABELS_FETCH_POOLING_TIME_MS =
  ENVS.TRAINING_AREA_LABELS_FETCH_POOLING_INTERVAL_MS || 5000;

/**
 * The time to poll the backend for the status of the OSM last updated time, in milliseconds (ms).
 * Data type: Positive Integer (e.g., 900).
 * Default value: 10000 milliseconds (10 seconds).
 */
export const OSM_LAST_UPDATED_POOLING_INTERVAL_MS =
  ENVS.OSM_LAST_UPDATED_POOLING_INTERVAL_MS || 10000;

/**
 * Distance of the elements from the navbar in px for dropdowns and popups on the start mapping page.
 */
export const ELEMENT_DISTANCE_FROM_NAVBAR = 10;

/**
   The maximum GeoJSON file(s) containing the training labels, a user can upload for an AOI/Training Area.
   Data type: Positive Integer (e.g., 1).
   Default value: 1 (1 GeoJSON file).
*/
export const MAX_GEOJSON_FILE_UPLOAD_FOR_TRAINING_AREA_LABELS =
  ENVS.MAX_GEOJSON_FILE_UPLOAD_FOR_TRAINING_AREA_LABELS || 1;

/**
   The maximum GeoJSON file(s) containing the training areas/AOI polygon geometry that a user can upload.
   Data type: Positive Integer (e.g., 1).
   Default value: 10 (10 GeoJSON files, assumming each file has a single AOI).
*/
export const MAX_GEOJSON_FILE_UPLOAD_FOR_TRAINING_AREAS =
  ENVS.MAX_GEOJSON_FILE_UPLOAD_FOR_TRAINING_AREAS || 10;

/**
  The maximum polygon geometry a single training area GeoJSON file can contain.
  Data type: Positive Integer (e.g., 1).
  Default value: 10 (10 polygon geometries).
*/
export const MAX_ACCEPTABLE_POLYGON_IN_TRAINING_AREA_GEOJSON_FILE =
  ENVS.MAX_ACCEPTABLE_POLYGON_IN_TRAINING_AREA_GEOJSON_FILE || 10;


/**
  The Base URL for OAM's Titiler.
  Data type: String (e.g.,https://titiler.hotosm.org/).
  Default value: https://titiler.hotosm.org/.
*/
export const OAM_TITILER_ENDPOINT = ENVS.OAM_TITILER_ENDPOINT || "https://titiler.hotosm.org/";



/**
  The new S3 bucket for OAM aerial imageries.
  Data type: String (e.g.,https://oin-hotosm-temp.s3.us-east-1.amazonaws.com/).
  Default value: https://oin-hotosm-temp.s3.us-east-1.amazonaws.com/.
*/
export const OAM_S3_BUCKET_URL = ENVS.OAM_S3_BUCKET_URL || "https://oin-hotosm-temp.s3.us-east-1.amazonaws.com/";
