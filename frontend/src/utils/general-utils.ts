import "@shoelace-style/shoelace/dist/components/alert/alert.js";

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
  duration: number = 3000,
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

export const showErrorToast = (
  error: any | undefined = undefined,
  customMessage: string | undefined = undefined,
) => {
  let message = "An unexpected error occurred";
  if (customMessage) {
    message = customMessage;
  } else if (
    error?.response?.data &&
    typeof error?.response?.data !== "object"
  ) {
    message = error?.response?.data;
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
