import { API_ENDPOINTS, BASE_API_URL } from "@/services";
import { Feature, FeatureCollection } from "@/types";
import { calculateGeoJSONArea } from "./geometry-utils";
import { MAX_TRAINING_AREA_SIZE, MIN_TRAINING_AREA_SIZE } from "./constants";
import { useToastNotification } from "@/hooks/use-toast-notification";

const FAIR_VERSION = "v0.1";

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

export const validateGeoJSONArea = (geojsonFeature: Feature) => {
  const area = calculateGeoJSONArea(geojsonFeature);
  return area < MIN_TRAINING_AREA_SIZE || area > MAX_TRAINING_AREA_SIZE;
};

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

export const showSuccessToast = (customMessage: string = "") => {
  const toast = useToastNotification();
  toast(customMessage, "success");
};

export const showWarningToast = (customMessage: string = "") => {
  const toast = useToastNotification();
  toast(customMessage, "warning");
};
