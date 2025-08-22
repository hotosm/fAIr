import { AxiosError } from "axios";

import "@shoelace-style/shoelace/dist/components/alert/alert.js";
import { DefaultError } from "@tanstack/react-query";

import { ExtendedAxiosError, TModelDetails } from "@/types";
import {
  FAIR_MODELS_BASE_PATH,
  PREDICTION_API_FILE_EXTENSIONS,
} from "@/config";
import { BASE_MODELS } from "@/enums";

/**
 * Custom function for displaying toast notifications.
 * @param {string} message - The message to display in the notification.
 * @param {"primary" | "success" | "neutral" | "warning" | "danger"} [variant="primary"] - Type of notification style. It defaults to primary.
 * @param {number} [duration=3000] - Duration in milliseconds for how long the notification stays visible.
 *
 * @example
 * createToastNotification("Data saved successfully", "success", 2000);
 */

export const createToastNotification = (
  message: string,
  variant: "primary" | "success" | "neutral" | "warning" | "danger" = "primary",
  duration: number = 3000
) => {
  const alert = Object.assign(document.createElement("sl-alert"), {
    variant,
    closable: true,
    duration,
    innerHTML: `
            ${message}
          `,
  });
  // make the variant the classname
  alert.classList.add(variant);
  document.body.append(alert);

  alert.toast();
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

export const showErrorToast = (error: string | AxiosError | DefaultError) => {
  let message = "An unexpected error occurred";

  if (error) {
    // Custom errors
    if (typeof error === "string") {
      message = error;
      // Backend/API errors
    } else if ((error as AxiosError).response) {
      const axiosError = error as ExtendedAxiosError;
      if (typeof axiosError.response?.data === "string") {
        message = axiosError.response.data;
        // Handle different types of error responses
      } else if (axiosError.response?.data?.message) {
        message = axiosError.response.data.message;
      } else if (axiosError.response?.data?.detail) {
        message = axiosError.response.data.detail;
      } else if (
        Array.isArray(axiosError.response?.data) &&
        axiosError.response.data[0]
      ) {
        message = axiosError.response.data[0];
      } else if (axiosError.response?.statusText) {
        message = axiosError.response.statusText;
      }
    } else if (error.message) {
      message = error.message;
    }
  }
  createToastNotification(message, "danger");
};

/**
 * Displays a success message as a toast notification.
 *
 * @param {string} message - Optional. The message that will be displayed as the toast notification.
 */
export const showSuccessToast = (message: string = "") => {
  createToastNotification(message, "success");
};

/**
 * Displays a warning message as a toast notification.
 *
 * @param {string} message - Optional. The message that will be displayed as the toast notification.
 */
export const showWarningToast = (message: string = "") => {
  createToastNotification(message, "warning");
};

/**
 * Generate a unique UUID4.
 * // reference: https://github.com/JamesLMilner/terra-draw/blob/main/src/util/id.ts
 * @returns {string} Returns the generate uuid4.
 */
export const uuid4 = function (): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};
/**
 *
 * @param modelInfo - The model information object containing dataset ID, training ID, and base model.
 * @returns {string} - The constructed model checkpoint path.
 */
export const constructModelCheckpointPath = (
  modelInfo: TModelDetails
): string => {
  const datasetId = modelInfo?.dataset?.id;
  const trainingId = modelInfo?.published_training;
  const fileExtension =
    PREDICTION_API_FILE_EXTENSIONS[modelInfo?.base_model as BASE_MODELS];

  if (!datasetId || !trainingId || !fileExtension) {
    throw new Error(
      "Invalid modelInfo provided. Ensure dataset ID, training ID, and base model are defined."
    );
  }
  // move to environment variable - /mnt/efsmount/data/trainings
  return `${FAIR_MODELS_BASE_PATH}/trainings/dataset_${datasetId}/output/training_${trainingId}/checkpoint${fileExtension}`;
};
