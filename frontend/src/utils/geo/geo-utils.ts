import bbox from "@turf/bbox";
import { API_ENDPOINTS, BASE_API_URL } from "@/services";
import { calculateGeoJSONArea } from "./geometry-utils";
import { Feature, FeatureCollection } from "geojson";
import { geojsonToOsmPolygons } from "./geojson-to-osm";
import { showErrorToast, showSuccessToast } from "../general-utils";
import {
  FAIR_VERSION,
  JOSM_REMOTE_URL,
  MAX_TRAINING_AREA_SIZE,
  MIN_TRAINING_AREA_SIZE,
  OSM_HASHTAGS,
  TOAST_NOTIFICATIONS,
} from "@/constants";

/**
 * Creates a GeoJSON FeatureCollection
 *
 * This function redirects the user to the OpenStreetMap ID Editor and preload the selected training area.
 *
 * @param {Feature[]} features - The GeoJSON features. If it's not provided, it creates an empty FeatureCollection.
 */
export const createFeatureCollection = (
  features: Feature[] = [],
): FeatureCollection => {
  return {
    type: "FeatureCollection",
    features: features,
  };
};

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
  let idEditorURL = `https://www.openstreetmap.org/edit?editor=id#disable_features=boundaries&gpx=${BASE_API_URL + API_ENDPOINTS.GET_TRAINING_AREA_GPX(aoiId)}&map=${zoomLevel}/${centerLat}/${centerLng}&background=custom:${encodeURIComponent(imageryURL)}&hashtags=${OSM_HASHTAGS}%23HOT-fAIr-${FAIR_VERSION},%23dataset-${datasetId},%23aoi-${aoiId}`;
  window.open(idEditorURL, "_blank", "noreferrer");
};

/**
 * Validates whether the area of a GeoJSON feature falls outside the acceptable range.
 *
 * This function calculates the area of the given GeoJSON feature and returns a boolean
 * indicating if the area is either smaller than `MIN_TRAINING_AREA_SIZE` or larger
 * than `MAX_TRAINING_AREA_SIZE`.
 *
 * @param {Feature} geojsonFeature - The GeoJSON feature to validate.
 * @returns {boolean} Returns `true` if the area is out of the specified range,
 *                      otherwise `false`.
 */

export const validateGeoJSONArea = (geojsonFeature: Feature) => {
  const area = calculateGeoJSONArea(geojsonFeature);
  return area < MIN_TRAINING_AREA_SIZE || area > MAX_TRAINING_AREA_SIZE;
};

/**
 * Downloads a GeoJSON file to the user's device.
 *
 * This function takes a GeoJSON `Feature` or `FeatureCollection`, converts it to a JSON string,
 * creates a downloadable file, and triggers a download for the user.
 *
 * @param {Feature|FeatureCollection} geojson - The GeoJSON Feature or FeatureCollection to download.
 * @param {string} filename  The name to save the downloaded file, without the extension.
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

export const openInJOSM = async (
  oamTileName: string,
  tmsURL: string,
  features?: Feature[],
  toXML = false,
) => {
  try {
    const imgURL = new URL(`${JOSM_REMOTE_URL}imagery`);
    imgURL.searchParams.set("type", "tms");
    imgURL.searchParams.set("title", oamTileName);
    imgURL.searchParams.set("url", tmsURL);

    const imgResponse = await fetch(imgURL);

    if (!imgResponse.ok) {
      showErrorToast(undefined, TOAST_NOTIFICATIONS.josmImageryLoadFailed);
      return;
    }

    try {
      const bounds = bbox(createFeatureCollection(features));
      const loadurl = new URL(`${JOSM_REMOTE_URL}load_and_zoom`);
      loadurl.searchParams.set("bottom", String(bounds[1]));
      loadurl.searchParams.set("top", String(bounds[3]));
      loadurl.searchParams.set("left", String(bounds[0]));
      loadurl.searchParams.set("right", String(bounds[2]));
      await fetch(loadurl);
      showSuccessToast(TOAST_NOTIFICATIONS.josmOpenSuccess);
    } catch (error) {
      showErrorToast(undefined, TOAST_NOTIFICATIONS.josmBBOXZoomFailed);
    }
    // XML Conversion
    if (toXML) {
      try {
        const _data = geojsonToOsmPolygons(createFeatureCollection(features));
        const loadData = new URL(`${JOSM_REMOTE_URL}load_data`);
        loadData.searchParams.set("new_layer", "true");
        loadData.searchParams.set("data", `${_data}`);
        const response = await fetch(loadData);
        // No need to show success toast since there'll be a success toast later on
        // This is to avoid multiple toasts showing up at once.
        if (!response.ok) {
          showErrorToast(undefined, TOAST_NOTIFICATIONS.errorLoadingData);
        }
      } catch (error) {
        showErrorToast(error);
      }
    }
  } catch (error) {
    showErrorToast(undefined, TOAST_NOTIFICATIONS.josmOpenFailed);
  }
};
