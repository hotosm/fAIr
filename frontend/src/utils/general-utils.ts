import {
  FAIR_MODELS_BASE_PATH,
  PREDICTION_API_FILE_EXTENSIONS,
} from "@/config";
import { BASE_MODELS } from "@/enums";
import { useToastNotification } from "@/hooks/use-toast-notification";
import { TModelDetails } from "@/types";

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
  } else if (
    error?.response?.data &&
    typeof error?.response?.data !== "object"
  ) {
    message = error?.response?.data;
  } else if (error?.response?.data?.error) {
    message = error.response.data.error;
  } else if (error?.response?.data?.message) {
    message = error.response.data.message;
  } else if (error?.response?.data?.detail) {
    message = error?.response?.data?.detail;
  } else if (error?.response?.data[0]) {
    message = error?.response?.data[0];
  } else if (error.response?.statusText) {
    message = error.response?.statusText;
  } else if (error.message) {
    message = error.message;
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
  modelInfo: TModelDetails,
): string => {
  const datasetId = modelInfo?.dataset?.id;
  const trainingId = modelInfo?.published_training;
  const fileExtension =
    PREDICTION_API_FILE_EXTENSIONS[modelInfo?.base_model as BASE_MODELS];

  if (!datasetId || !trainingId || !fileExtension) {
    throw new Error(
      "Invalid modelInfo provided. Ensure dataset ID, training ID, and base model are defined.",
    );
  }
  // move to environment variable - /mnt/efsmount/data/trainings
  return `${FAIR_MODELS_BASE_PATH}/trainings/dataset_${datasetId}/output/training_${trainingId}/checkpoint${fileExtension}`;
};
