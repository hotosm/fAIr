/**
 * The environment variables. Ideally these values should be set in the .env file.
 */
export const ENVS = {
  BASE_API_URL: import.meta.env.VITE_BASE_API_URL,
  MATOMO_ID: import.meta.env.VITE_MATOMO_ID,
  MATOMO_APP_DOMAIN: import.meta.env.VITE_MATOMO_APP_DOMAIN,

  /**
   * The cache duration for polling the backend for updated statistics, in seconds.
   */

  KPI_STATS_CACHE_TIME: import.meta.env.KPI_STATS_CACHE_TIME,
  /**
   * The maximum allowed area size (in square meters) for training areas.
   */
  MAX_TRAINING_AREA_SIZE: import.meta.env.MAX_TRAINING_AREA_SIZE,
  /**
   * The minimum allowed area size (in square meters) for training areas.
   */
  MIN_TRAINING_AREA_SIZE: import.meta.env.MIN_TRAINING_AREA_SIZE,

  /**
   * The maximum file size (in bytes) allowed for training area upload.
   * This is set to 5 MB.
   */
  MAX_TRAINING_AREA_UPLOAD_FILE_SIZE: import.meta.env
    .MAX_TRAINING_AREA_UPLOAD_FILE_SIZE,
  /**
   * The current version of the application.
   * This is used in the OSM redirect callback when a training area is opened in OSM. The idea is to add it to the hashtag for future tracking.
   */
  FAIR_VERSION: import.meta.env.FAIR_VERSION,

  /**
   * The current version of the application.
   * This is used in the OSM redirect callback when a training area is opened in OSM.
   */

  OSM_HASHTAGS: import.meta.env.OSM_HASHTAGS,

  /**
   * The maximum zoom level for the map.
   */
  MAX_ZOOM_LEVEL: import.meta.env.MAX_ZOOM_LEVEL,
  /**
   * The minimum zoom level for the map before the prediction components can be activated.
   */

  MIN_ZOOM_LEVEL_FOR_START_MAPPING_PREDICTION: import.meta.env
    .MIN_ZOOM_LEVEL_FOR_START_MAPPING_PREDICTION,
  /**
   * The minimum zoom level to show the training area labels.
   */
  MIN_ZOOM_LEVEL_FOR_TRAINING_AREA_LABELS: import.meta.env
    .MIN_ZOOM_LEVEL_FOR_TRAINING_AREA_LABELS,

  /**
   * Training area and labels styles.
   */
  TRAINING_AREAS_AOI_FILL_COLOR: import.meta.env.TRAINING_AREAS_AOI_FILL_COLOR,
  TRAINING_AREAS_AOI_OUTLINE_COLOR: import.meta.env
    .TRAINING_AREAS_AOI_OUTLINE_COLOR,
  TRAINING_AREAS_AOI_OUTLINE_WIDTH: import.meta.env
    .TRAINING_AREAS_AOI_OUTLINE_WIDTH,
  TRAINING_AREAS_AOI_FILL_OPACITY: import.meta.env
    .TRAINING_AREAS_AOI_FILL_OPACITY,
  TRAINING_AREAS_AOI_LABELS_FILL_OPACITY: import.meta.env
    .TRAINING_AREAS_AOI_LABELS_FILL_OPACITY,
  TRAINING_AREAS_AOI_LABELS_OUTLINE_WIDTH: import.meta.env
    .TRAINING_AREAS_AOI_LABELS_OUTLINE_WIDTH,
  TRAINING_AREAS_AOI_LABELS_FILL_COLOR: import.meta.env
    .TRAINING_AREAS_AOI_LABELS_FILL_COLOR,
  TRAINING_AREAS_AOI_LABELS_OUTLINE_COLOR: import.meta.env
    .TRAINING_AREAS_AOI_LABELS_OUTLINE_COLOR,
};
