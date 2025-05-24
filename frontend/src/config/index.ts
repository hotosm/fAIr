import { BASE_MODELS } from "@/enums";
import { ENVS } from "@/config/env";
import { StyleSpecification } from "maplibre-gl";
import { PredictedFeatureStatus } from "@/enums/start-mapping";

// ==============================================================================================================================
// Helper functions
// ==============================================================================================================================

/**
 * Helper function to safely parse environment variables as integers.
 */
export const parseIntEnv = (
  value: string | undefined,
  defaultValue: number,
): number =>
  value !== undefined && !isNaN(parseInt(value, 10))
    ? parseInt(value, 10)
    : defaultValue;

/**
 * Helper function to safely parse environment variables as floats.
 */
export const parseFloatEnv = (
  value: string | undefined,
  defaultValue: number,
): number =>
  value !== undefined && !isNaN(parseFloat(value))
    ? parseFloat(value)
    : defaultValue;

/**
 * Helper function to safely parse environment variables as strings.
 */
export const parseStringEnv = (
  value: string | undefined,
  defaultValue: string,
): string => (value && value.trim() !== "" ? value.trim() : defaultValue);

// ==============================================================================================================================
// API Endpoints
// ==============================================================================================================================

/**
 * The backend api endpoint url.
 * Note: Ensure CORs is enabled in the backend and access is given to your port.
 */
export const BASE_API_URL: string = parseStringEnv(
  ENVS.BASE_API_URL,
  "http://localhost:8000/api/v1/",
);

/**
 * The Base URL for OAM's Titiler.
 */
export const OAM_TITILER_ENDPOINT: string = parseStringEnv(
  ENVS.OAM_TITILER_ENDPOINT,
  "https://titiler.hotosm.org/",
);

/**
 * The new S3 bucket for OAM aerial imageries.
 */
export const OAM_S3_BUCKET_URL: string = parseStringEnv(
  ENVS.OAM_S3_BUCKET_URL,
  "https://oin-hotosm-temp.s3.us-east-1.amazonaws.com/",
);

/**
 * The remote url to JOSM.
 */
export const JOSM_REMOTE_URL: string = parseStringEnv(
  ENVS.JOSM_REMOTE_URL,
  "http://127.0.0.1:8111/",
);

/**
 * The OSM Database status API endpoint.
 */
export const OSM_DATABASE_STATUS_API_ENDPOINT: string = parseStringEnv(
  ENVS.OSM_DATABASE_STATUS_API_URL,
  "https://api-prod.raw-data.hotosm.org/v1/status/",
);

/**
 * The model prediction endpoint.
 */
export const FAIR_PREDICTOR_API_ENDPOINT: string = parseStringEnv(
  ENVS.FAIR_PREDICTOR_API_URL,
  "https://predictor-dev.fair.hotosm.org/predict/",
);

// ==============================================================================================================================
// Local & Session Storage Keys
// ==============================================================================================================================

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
export const HOT_FAIR_LOGIN_SUCCESSFUL_SESSION_KEY: string =
  "__hot_fair_login_successful";

/**
 * The key used to store the model form data in session storage to preserve the state incase the user
 * visits ID Editor or JOSM to map a training area.
 * Local storage is used to withstand reloads and network issues.
 */
export const HOT_FAIR_MODEL_CREATION_LOCAL_STORAGE_KEY: string =
  "__hot_fair_model_creation_formdata";

/**
 * The key used to store the banner state in local storage for the application.
 */
export const HOT_FAIR_BANNER_LOCAL_STORAGE_KEY: string =
  "__hot_fair_banner_closed";

/**
 * The key used to store the predictions for the specific model in the users local storage.
 */
export const HOT_FAIR_MODEL_PREDICTIONS_LOCAL_STORAGE_KEY = (
  modelId: string,
): string => `__hot_fair_model_predictions_for_model_${modelId}`;

/**
 * The key used to store the training area tour seen status in local storage for the application.
 */
export const TRAINING_AREA_TOUR_LOCAL_STORAGE_KEY =
  "__fAIr_training_area_tour_seen";

// ==============================================================================================================================
// Training Area Configurations
// ==============================================================================================================================

/**
 * The maximum allowed area size (in square meters) for training areas.
 */
export const MAX_TRAINING_AREA_SIZE: number = parseIntEnv(
  ENVS.MAX_TRAINING_AREA_SIZE,
  5000000,
);

/**
 * The minimum allowed area size (in square meters) for training areas.
 * The default is set to 5797 sq. meters (1.43 acres).
 */
export const MIN_TRAINING_AREA_SIZE: number = parseIntEnv(
  ENVS.MIN_TRAINING_AREA_SIZE,
  5797,
);

/**
 * The maximum file size (in bytes) allowed for training area upload.
 * The default is set to 5 MB.
 */
export const MAX_TRAINING_AREA_UPLOAD_FILE_SIZE: number = parseIntEnv(
  ENVS.MAX_TRAINING_AREA_UPLOAD_FILE_SIZE,
  5 * 1024 * 1024,
);

/**
 * The maximum GeoJSON file(s) containing the training labels, a user can upload for an AOI/Training Area.
 * Default value: 1 (1 GeoJSON file).
 */
export const MAX_GEOJSON_FILE_UPLOAD_FOR_TRAINING_AREA_LABELS: number =
  parseIntEnv(ENVS.MAX_GEOJSON_FILE_UPLOAD_FOR_TRAINING_AREA_LABELS, 1);

/**
 * The maximum GeoJSON file(s) containing the training areas/AOI polygon geometry that a user can upload.
 * Default value: 10 (10 GeoJSON files, assumming each file has a single AOI).
 */
export const MAX_GEOJSON_FILE_UPLOAD_FOR_TRAINING_AREAS: number = parseIntEnv(
  ENVS.MAX_GEOJSON_FILE_UPLOAD_FOR_TRAINING_AREAS,
  10,
);

/**
 * The maximum polygon geometry a single training area GeoJSON file can contain.
 * Default value: 10 (10 polygon geometries).
 */
export const MAX_ACCEPTABLE_POLYGON_IN_TRAINING_AREA_GEOJSON_FILE: number =
  parseIntEnv(ENVS.MAX_ACCEPTABLE_POLYGON_IN_TRAINING_AREA_GEOJSON_FILE, 10);

// ==============================================================================================================================
// Map Configurations
// ==============================================================================================================================

/**
 * The maximum zoom level for the map.
 * Model predictions require a max zoom of 22.
 * 21 is used here because 1 is already added to the 'currentZoom' in the useMapInstance() hook.
 */
export const MAX_ZOOM_LEVEL: number = parseIntEnv(ENVS.MAX_ZOOM_LEVEL, 21);

/**
 * The minimum zoom level for the map before the prediction components can be activated.
 */
export const MIN_ZOOM_LEVEL_FOR_START_MAPPING_PREDICTION: number = parseIntEnv(
  ENVS.MIN_ZOOM_LEVEL_FOR_START_MAPPING_PREDICTION,
  18,
);

/**
 * The instruction to show the users when they haven't reach the minimum zoom level on the start mapping page.
 */
export const MINIMUM_ZOOM_LEVEL_INSTRUCTION_FOR_PREDICTION: string = `Zoom in to at least zoom ${MIN_ZOOM_LEVEL_FOR_START_MAPPING_PREDICTION} to start mapping.`;

/**
 * A unique ID to append to all custom map sources and layers ids. This is useful for the legend component to dynamically get the layers on the map excluding the basemaps styles.
 */
export const MAP_STYLES_PREFIX: string = "fAIr";

/**
 * The minimum zoom level to show the training area labels.
 */
export const MIN_ZOOM_LEVEL_FOR_TRAINING_AREA_LABELS: number = parseIntEnv(
  ENVS.MIN_ZOOM_LEVEL_FOR_TRAINING_AREA_LABELS,
  18,
);

/**
 * OSM Basemap style.
 */
export const MAP_STYLES: Record<string, string | StyleSpecification> = {
  OSM: {
    version: 8,
    // "glyphs": "mapbox://fonts/mapbox/{fontstack}/{range}.pbf",
    //https://fonts.openmaptiles.org/{fontstack}/{range}.pbf
    glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
    sources: {
      "raster-tiles": {
        type: "raster",
        tiles: ["https://a.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"],
        tileSize: 128,
        attribution:
          '© <a href="https://www.openstreetmap.org/copyright/">OpenStreetMap</a> contributors',
      },
    },
    layers: [
      {
        id: "simple-tiles",
        type: "raster",
        source: "raster-tiles",
        minzoom: 0,
        maxzoom: 22,
      },
    ],
  },
};

// ==============================================================================================================================
// Layers, Sources and Name Mappings
// ==============================================================================================================================

// Shared (Basemaps, Tile Boundaries)
export const TILE_BOUNDARY_LAYER_ID: string = `${MAP_STYLES_PREFIX}-tile-boundary-layer`;
export const TILE_BOUNDARY_SOURCE_ID: string = `${MAP_STYLES_PREFIX}-tile-boundaries`;
export const TMS_LAYER_ID: string = `${MAP_STYLES_PREFIX}-oam-tms-layer`;
export const TMS_SOURCE_ID: string = `${MAP_STYLES_PREFIX}-oam-training-dataset`;
export const OSM_BASEMAP_LAYER_ID: string = `${MAP_STYLES_PREFIX}-osm-layer`;
export const GOOGLE_SATELLITE_BASEMAP_LAYER_ID: string = `${MAP_STYLES_PREFIX}-google-statellite-layer`;
export const GOOGLE_SATELLITE_BASEMAP_SOURCE_ID: string = `${MAP_STYLES_PREFIX}-google-satellite`;

// Start Mapping
export const ALL_MODEL_PREDICTIONS_SOURCE_ID: string = "all-predictions-source";
export const ALL_MODEL_PREDICTIONS_FILL_LAYER_ID: string = `${MAP_STYLES_PREFIX}-all-predictions-fill-layer`;
export const ALL_MODEL_PREDICTIONS_OUTLINE_LAYER_ID: string =
  "all-predictions-outline-layer";

// Layer status and corresponding colors
export const PREDICTED_LAYER_STATUS_COLORS: Record<string, string> = {
  [PredictedFeatureStatus.ACCEPTED]: "#23C16B",
  [PredictedFeatureStatus.REJECTED]: "#D63F40",
  [PredictedFeatureStatus.UNTOUCHED]: "#A243DC",
};
export const PREDICTION_IMAGERY_SOURCE: string = `${MAP_STYLES_PREFIX}-prediction-imagery-source`;
export const PREDICTION_IMAGERY_LAYER_ID: string = `${MAP_STYLES_PREFIX}-prediction-imagery-layer`;
// Training Areas
export const TRAINING_AREAS_AOI_FILL_COLOR: string = parseStringEnv(
  ENVS.TRAINING_AREAS_AOI_FILL_COLOR,
  "#247DCACC",
);
export const TRAINING_AREAS_AOI_OUTLINE_COLOR: string = parseStringEnv(
  ENVS.TRAINING_AREAS_AOI_OUTLINE_COLOR,
  "#247DCACC",
);
export const TRAINING_AREAS_AOI_OUTLINE_WIDTH: number = parseIntEnv(
  ENVS.TRAINING_AREAS_AOI_OUTLINE_WIDTH,
  4,
);
export const TRAINING_AREAS_AOI_FILL_OPACITY: number = parseFloatEnv(
  ENVS.TRAINING_AREAS_AOI_FILL_OPACITY,
  0.4,
);
export const TRAINING_AREAS_AOI_LABELS_FILL_OPACITY: number = parseFloatEnv(
  ENVS.TRAINING_AREAS_AOI_LABELS_FILL_OPACITY,
  0.3,
);
export const TRAINING_AREAS_AOI_LABELS_OUTLINE_WIDTH: number = parseIntEnv(
  ENVS.TRAINING_AREAS_AOI_LABELS_OUTLINE_WIDTH,
  2,
);
export const TRAINING_AREAS_AOI_LABELS_FILL_COLOR: string = parseStringEnv(
  ENVS.TRAINING_AREAS_AOI_LABELS_FILL_COLOR,
  "#D73434",
);
export const TRAINING_AREAS_AOI_LABELS_OUTLINE_COLOR: string = parseStringEnv(
  ENVS.TRAINING_AREAS_AOI_LABELS_OUTLINE_COLOR,
  "#D73434",
);

export const TRAINING_AREAS_MASK_FILL_COLOR: string = parseStringEnv(
  ENVS.TRAINING_AREAS_MASK_FILL_COLOR,
  "#D73434",
);

// Start Mapping Legend - only the fill layers are in the legend.
export const LEGEND_NAME_MAPPING: Record<string, string> = {
  [ALL_MODEL_PREDICTIONS_FILL_LAYER_ID]: "Default",
  // [REJECTED_MODEL_PREDICTIONS_FILL_LAYER_ID]: "Rejected",
  // [ACCEPTED_MODEL_PREDICTIONS_FILL_LAYER_ID]: "Accepted",
};

// Model Feedbacks
export const MODEL_FEEDBACKS_OUTLINE_LAYER_ID: string = `${MAP_STYLES_PREFIX}-feedbacks-outline-layer`;
export const MODEL_FEEDBACKS_SOURCE_ID: string = `${MAP_STYLES_PREFIX}-feedbacks-source`;
export const MODEL_FEEDBACKS_FILL_LAYER_ID: string = `${MAP_STYLES_PREFIX}-feedbacks-fill-layer`;
export const MODEL_FEEDBACKS_SYMBOL_LAYER_ID: string = `${MAP_STYLES_PREFIX}-feedbacks-symbol-layer`;
export const MODEL_FEEDBACKS_FILL_COLOR: string = "#D73434";
export const MODEL_FEEDBACKS_OUTLINE_COLOR: string = "#D73434";
export const MODEL_FEEDBACKS_OUTLINE_WIDTH: number = 4;
export const MODEL_FEEDBACKS_FILL_OPACITY: number = 0.4;

// ==============================================================================================================================
// Others
// ==============================================================================================================================

/**
 * The matomo application ID.
 * Default value: "0".
 * Matomo will be used as an attribute in the hot-tracking component, so we need to pass it as string to the component.
 */
export const MATOMO_ID: string = parseStringEnv(ENVS.MATOMO_ID, "0");

/**
 * The matomo application domain.
 */
export const MATOMO_APP_DOMAIN: string = parseStringEnv(
  ENVS.MATOMO_APP_DOMAIN,
  "fair.hotosm.org",
);

/**
 * The matomo tracking URL.
 */
export const MATOMO_TRACKING_URL: string = parseStringEnv(
  ENVS.MATOMO_TRACKING_URL,
  "https://matomo.hotosm.org",
);

/**
 * The web component tag name used in `hotosm/ui` for the tracking component.
 */
export const HOT_TRACKING_HTML_TAG_NAME: string = "hot-tracking";


export const BANNER_TIMEOUT_DURATION: number = parseIntEnv(
  ENVS.BANNER_TIMEOUT_DURATION,
  3000,
);

/**
 * The file extensions for the prediction api.
 */
export const PREDICTION_API_FILE_EXTENSIONS: Record<BASE_MODELS, string> = {
  [BASE_MODELS.RAMP]: ".tflite",
  [BASE_MODELS.YOLOV8_V1]: ".onnx",
  [BASE_MODELS.YOLOV8_V2]: ".onnx",
};

/**
 * The time to poll the backend for the status of the AOI training labels fetching, in milliseconds (ms).
 * Default value: 5000 ms (5 seconds).
 */
export const TRAINING_AREA_LABELS_FETCH_POOLING_TIME_MS: number = parseIntEnv(
  ENVS.TRAINING_AREA_LABELS_FETCH_POOLING_INTERVAL_MS,
  5000,
);

/**
 * The time to poll the backend for the status of the OSM last updated time, in milliseconds (ms).
 * Default value: 10000 (ms i.e 10 seconds).
 */
export const OSM_LAST_UPDATED_POOLING_INTERVAL_MS: number = parseIntEnv(
  ENVS.OSM_LAST_UPDATED_POOLING_INTERVAL_MS,
  10000,
);

/**
 * The time to poll the backend for the user notifications, in milliseconds (ms).
 * Default value: 10000 (ms i.e 10 seconds).
 */
export const NOTIFICATIONS_POLLING_INTERVAL_MS: number = 10000;

/**
 * The current version of the application.
 * This is used in the OSM redirect callback when a training area is opened in OSM.
 */
export const FAIR_VERSION: string = parseStringEnv(ENVS.FAIR_VERSION, "v0.1");

/**
 * Comma separated hashtags to add to the OSM ID Editor redirection.
 * This is used in the OSM redirect callback when a training area is opened in OSM.
 */
export const OSM_HASHTAGS: string = parseStringEnv(
  ENVS.OSM_HASHTAGS,
  "#HOT-fAIr",
);

/**
 * Configuration for KPI Statistics Refetching Interval.
 */

// Default cache time in seconds (15 minutes)
const DEFAULT_KPI_STATS_CACHE_TIME_SECONDS: number = 900;

// Buffer time in milliseconds (1 second)
const REFRESH_BUFFER_MS: number = 1000;

/**
 * The cache time to poll the backend for updated KPI statistics, in milliseconds.
 * It includes an additional buffer to ensure fresh data retrieval.
 */
export const KPI_STATS_CACHE_TIME_MS: number =
  parseIntEnv(ENVS.KPI_STATS_CACHE_TIME, DEFAULT_KPI_STATS_CACHE_TIME_SECONDS) *
  1000 +
  REFRESH_BUFFER_MS;

/**
 * The maximum tolerance for a prediction to be considered valid in the start mapping page.
 */
export const MAXIMUM_PREDICTION_TOLERANCE: number = parseIntEnv(
  ENVS.MAXIMUM_PREDICTION_TOLERANCE,
  10,
);

/**
 * The maximum area for a prediction to be considered valid in the start mapping page.
 */
export const MAXIMUM_PREDICTION_AREA: number = parseIntEnv(
  ENVS.MAXIMUM_PREDICTION_AREA,
  20,
);

/**
 * The base path to the model checkpoint files.
 */
export const FAIR_MODELS_BASE_PATH: string = parseStringEnv(
  ENVS.FAIR_MODELS_BASE_PATH,
  "/mnt/efsmount/data",
);

export const FAIR_BASE_MODELS_PATH: Record<BASE_MODELS, string> = {
  [BASE_MODELS.RAMP]: `${FAIR_MODELS_BASE_PATH}/basemodels/ramp/baseline.tflite`,
  [BASE_MODELS.YOLOV8_V1]: `${FAIR_MODELS_BASE_PATH}/basemodels/yolo/yolov8s_v1-seg.onnx`,
  [BASE_MODELS.YOLOV8_V2]: `${FAIR_MODELS_BASE_PATH}/basemodels/yolo/yolov8s_v2-seg.onnx`,
};

/**
 *  The default offset step for the training labels offset controller.
 */
export const OFFSET_STEP: number = parseIntEnv(ENVS.OFFSET_STEP, 0.5);
// ==============================================================================================================================
// UI Settings
// ==============================================================================================================================

/**
 * Distance of the elements from the navbar in px for dropdowns and popups on the start mapping page.
 */
export const ELEMENT_DISTANCE_FROM_NAVBAR: number = 10;
