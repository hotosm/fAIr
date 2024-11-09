import { API_ENDPOINTS, BASE_API_URL } from "@/services";
import { Feature, FeatureCollection } from "@/types";
import { calculateGeoJSONArea } from "./geometry-utils";
import { FAIR_VERSION, MAX_TRAINING_AREA_SIZE, MIN_TRAINING_AREA_SIZE } from "./constants";
import { useToastNotification } from "@/hooks/use-toast-notification";




/**
 * Open the AOI (Training Area) in ID Editor.
 *
 * This function redirects the user to the OpenStreetMap ID Editor and preload the selected training area.
 *
 * @param {number} bottomLat - The bottom latitude coordinate of the training area bounding box.
 * @param {number} topLat - The op latitude coordinat eof the training area bounding box.
 * @param {number} leftLng - The left longitude coordinate of the training area bounding box.
 * @param {number} rightLng - The right longitude coordinate of the training area bounding box.
 * @param {string} imageryURL - The openaerialmap TMS url for the training area.
 * @param {string} datasetId - The unique ID of the dataset. The purpose is to add it to the hashtags for tracking.
 * @param {number} aoiId - The unique ID of the AOI. The purpose of this is to add it to the hashtags for tracking.
 */

export const openInIDEditor = (
  bottomLat: number,
  topLat: number,
  leftLng: number,
  rightLng: number,
  imageryURL: string,
  datasetId: string,
  aoiId: number,
) => {
  const centerLat = (bottomLat + topLat) / 2;
  const centerLng = (leftLng + rightLng) / 2;
  const zoomLevel = 17;
  let idEditorURL = `https://www.openstreetmap.org/edit?editor=id#disable_features=boundaries&gpx=${BASE_API_URL + API_ENDPOINTS.GET_TRAINING_AREA_GPX(aoiId)}&map=${zoomLevel}/${centerLat}/${centerLng}&background=custom:${encodeURIComponent(imageryURL)}&hashtags=%23HOT-fAIr-${FAIR_VERSION},%23dataset-${datasetId},%23aoi-${aoiId}`;
  window.open(idEditorURL, "_blank", "noreferrer");
};

/**
 * Downloads a GeoJSON file to the user's device.
 *
 * This function takes a GeoJSON `Feature` or `FeatureCollection`, converts it to a JSON string,
 * creates a downloadable file, and triggers a download for the user.
 *
 * @param {Feature|FeatureCollection} geojson - The GeoJSON Feature or FeatureCollection to download.
 * @param {string} filename - The name to save the downloaded file, without the extension.
 */
export const geoJSONDowloader = (
  geojson: FeatureCollection | Feature,
  filename: string,
) => {
  const geojsonStr = JSON.stringify(geojson);
  const blob = new Blob([geojsonStr], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.geojson`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return;
};


/**
 * Validates whether the area of a GeoJSON feature falls outside the acceptable range.
 *
 * This function calculates the area of the given GeoJSON feature and returns a boolean
 * indicating if the area is either smaller than `MIN_TRAINING_AREA_SIZE` or larger
 * than `MAX_TRAINING_AREA_SIZE`.
 *
 * @param {Feature} geojsonFeature - The GeoJSON feature to validate.
 * @returns {boolean} - Returns `true` if the area is out of the specified range,
 *                      otherwise `false`.
 */

export const validateGeoJSONArea = (geojsonFeature: Feature) => {
  const area = calculateGeoJSONArea(geojsonFeature);
  return area < MIN_TRAINING_AREA_SIZE || area > MAX_TRAINING_AREA_SIZE;
};


/**
 * Displays an error message as a toast notification.
 *
 * This function extracts and prioritizes error messages from the provided `error` object,
 * falling back to a default message if none is specified. If a `customMessage` is provided,
 * it takes precedence over other messages. The final message is then displayed as a toast.
 *
 * @param {any} error - Optional. The error object containing details about the error.
 *                       Supports nested error messages, such as `response.data.message`.
 * @param {string} customMessage - Optional. A custom message that, if provided, will be
 *                                 displayed as the toast notification.
 */

export const showErrorToast = (
  error: any | undefined = undefined,
  customMessage: string | undefined = undefined,
) => {
  const toast = useToastNotification();

  let message = "An unexpected error occurred";
  if (customMessage) {
    message = customMessage;
  } else if (error?.response?.data[0]) {
    message = error?.response?.data[0];
  } else if (error?.response?.data?.message) {
    message = error.response.data.message;
  } else if (error?.message) {
    message = error.message;
  } else if (error?.response?.data?.detail) {
    message = error?.response?.data?.detail;
  } else if (error.response?.statusText) {
    message = error.response?.statusText;
  }

  toast(message, "danger");
};


/**
 * Displays a success message as a toast notification.
 *
 * @param {string} message - Optional. The message that will be displayed as the toast notification.
 */
export const showSuccessToast = (message: string = "") => {
  const toast = useToastNotification();
  toast(message, "success");
};


/**
 * Displays a warning message as a toast notification.
 *
 * @param {string} message - Optional. The message that will be displayed as the toast notification.
 */
export const showWarningToast = (message: string = "") => {
  const toast = useToastNotification();
  toast(message, "warning");
};
