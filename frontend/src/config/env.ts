/**
 * The environment variables. Ideally these values should be set in the .env file.
 */
export const ENVS = {

  /**
  # The backend api endpoint url.
  # Data type: String (e.g., http://localhost:8000/api/v1/).
  # Default value: http://localhost:8000/api/v1/.
  # Note: Ensure CORs is enabled in the backend and access is given to your port.
  */

  BASE_API_URL: import.meta.env.VITE_BASE_API_URL,

  /**
  # The matomo application ID.
  # Data type: Positive Integer (e.g., 0).
  # Default value: 0.
  */

  MATOMO_ID: import.meta.env.VITE_MATOMO_ID,

  /**
  # The matomo application domain.
  # Data type: String (e.g., subdomain.hotosm.org).
  # Default value: subdomain.hotosm.org.
  */

  MATOMO_APP_DOMAIN: import.meta.env.VITE_MATOMO_APP_DOMAIN,

  /**
  # The cache duration for polling the backend for updated statistics, in seconds.
  # Data type: Positive Integer (e.g., 900).
  # Default value: 900 seconds (15 minutes).
  # Note: If this value changes on the backend, please update it here to avoid unnecessary polling.
  */

  KPI_STATS_CACHE_TIME: import.meta.env.VITE_KPI_STATS_CACHE_TIME,

  /**
  # The maximum allowed area size for training areas, measured in square meters.
  # Data type: Positive Integer (e.g., 5000000).
  # Default value: 5000000 square meters (5 square kilometers).
  */

  MAX_TRAINING_AREA_SIZE: import.meta.env.VITE_MAX_TRAINING_AREA_SIZE,

  /**
  # The minumum allowed area size for training areas, measured in square meters.
  # Data type: Positive Integer (e.g., 5797).
  # Default value: 5797 square meters.
  */

  MIN_TRAINING_AREA_SIZE: import.meta.env.VITE_MIN_TRAINING_AREA_SIZE,

  /**
  # The maximum file size allowed for training area upload, measure in bytes.
  # Data type: Positive Integer (e.g., 500000).
  # Default value: 5242880 bytes (5 MB).
  */

  MAX_TRAINING_AREA_UPLOAD_FILE_SIZE: import.meta.env
    .VITE_MAX_TRAINING_AREA_UPLOAD_FILE_SIZE,

  /**
  # The current version of the application.
  # This is used in the OSM redirect callback when a training area is opened in OSM.
  # Data type: String (e.g., v1.1).
  # Default value: "v0.1".
  */

  FAIR_VERSION: import.meta.env.VITE_FAIR_VERSION,

  /**
  # Comma separated hashtags to add to the OSM ID Editor redirection.
  # Data type: String (e.g., '#HOT-fAIr, #AI-Assited-Mapping').
  # Default value: `FAIR_VERSION`.
  */

  OSM_HASHTAGS: import.meta.env.VITE_OSM_HASHTAGS,

  /**
  # The maximum zoom level for the map.
  # Data type: Positive Integer (e.g., 22).
  # Note: Value must be between 0 - 24.
  # Default value: 22.
  */

  MAX_ZOOM_LEVEL: import.meta.env.VITE_MAX_ZOOM_LEVEL,

  /**
  # The minimum zoom level before enabling the prediction button and other functionalities in the start mapping page.
  # Data type: Positive Integer (e.g., 22).
  # Note: Value must be between 0 - 24.
  # Default value: 19.
  */

  MIN_ZOOM_LEVEL_FOR_START_MAPPING_PREDICTION: import.meta.env
    .VITE_MIN_ZOOM_LEVEL_FOR_START_MAPPING_PREDICTION,

  /**
  # The minimum zoom level before enabling the training area labels in the training area map.
  # Data type: Positive Integer (e.g., 22).
  # Note: Value must be between 0 - 24.
  # Default value: 18.
  */

  MIN_ZOOM_LEVEL_FOR_TRAINING_AREA_LABELS: import.meta.env
    .VITE_MIN_ZOOM_LEVEL_FOR_TRAINING_AREA_LABELS,

  /**
  # The fill color for the training area AOI rectangles.
  # Data type: String (e.g., "#247DCACC").
  # Note: Colors must be hex codes or valid colors. e.g 'red', 'green', '#fff'.
  # Default value: #247DCACC.
  */

  TRAINING_AREAS_AOI_FILL_COLOR: import.meta.env
    .VITE_TRAINING_AREAS_AOI_FILL_COLOR,

  /**
  # The outline color for the training area AOI rectangles.
  # Data type: String (e.g., "#247DCACC").
  # Note: Colors must be hex codes or valid colors. e.g 'red', 'green', '#fff'.
  # Default value: #247DCACC.
  */

  TRAINING_AREAS_AOI_OUTLINE_COLOR: import.meta.env
    .VITE_TRAINING_AREAS_AOI_OUTLINE_COLOR,

  /**
  # The outline width for the training area AOI rectangles.
  # Data type: Positive Integer (e.g., 3).
  # Default value: 4.
  */

  TRAINING_AREAS_AOI_OUTLINE_WIDTH: import.meta.env
    .VITE_TRAINING_AREAS_AOI_OUTLINE_WIDTH,

  /**
  # The fill opacity for the training area AOI rectangles.
  # Data type: Float (e.g., 0.4).
  # Note: Value must be between 0 and 1.
  # Default value: 0.4.
  */

  TRAINING_AREAS_AOI_FILL_OPACITY: import.meta.env
    .VITE_TRAINING_AREAS_AOI_FILL_OPACITY,

  /**
  # The fill opacity for the training area AOI labels.
  # Data type: Float (e.g., 0.4).
  # Note: Value must be between 0 and 1.
  # Default value: 0.3.
  */

  TRAINING_AREAS_AOI_LABELS_FILL_OPACITY: import.meta.env
    .VITE_TRAINING_AREAS_AOI_LABELS_FILL_OPACITY,

  /**
  # The outline width for the training area AOI labels.
  # Data type: Positive Integer (e.g., 3).
  # Default value: 2.
  */

  TRAINING_AREAS_AOI_LABELS_OUTLINE_WIDTH: import.meta.env
    .VITE_TRAINING_AREAS_AOI_LABELS_OUTLINE_WIDTH,

  /**
  # The fill color for the training area AOI labels.
  # Data type: String (e.g., "#247DCACC").
  # Note: Colors must be hex codes or valid colors. e.g 'red', 'green', '#fff'.
  # Default value: #D73434.
  */

  TRAINING_AREAS_AOI_LABELS_FILL_COLOR: import.meta.env
    .VITE_TRAINING_AREAS_AOI_LABELS_FILL_COLOR,

  /**
  # The outline color for the training area AOI labels.
  # Data type: String (e.g., "#247DCACC").
  # Note: Colors must be hex codes or valid colors. e.g 'red', 'green', '#fff'.
  # Default value: #D73434.
  */

  TRAINING_AREAS_AOI_LABELS_OUTLINE_COLOR: import.meta.env
    .VITE_TRAINING_AREAS_AOI_LABELS_OUTLINE_COLOR,

  /**
  # The remote url to JOSM.
  # Data type: String (e.g., "http://127.0.0.1:8111/").
  # Default value: http://127.0.0.1:8111/.
  */

  JOSM_REMOTE_URL: import.meta.env.VITE_JOSM_REMOTE_URL,

  /**
   # The time to poll the backend for the status of the AOI training labels fetching, in milliseconds (ms).
   # Data type: Positive Integer (e.g., 900).
   # Default value: 5000 milliseconds (5 seconds).
   */
  TRAINING_AREA_LABELS_FETCH_POOLING_INTERVAL_MS: import.meta.env.VITE_TRAINING_AREA_LABELS_FETCH_POOLING_INTERVAL_MS,

  /**
   # The time to poll the backend for the status of the OSM last updated time, in milliseconds (ms).
   # Data type: Positive Integer (e.g., 900).
   # Default value: 10000 milliseconds (10 seconds).
  */

  OSM_LAST_UPDATED_POOLING_INTERVAL_MS: import.meta.env.VITE_OSM_LAST_UPDATED_POOLING_INTERVAL_MS
};


