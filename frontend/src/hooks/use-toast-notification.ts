import "@shoelace-style/shoelace/dist/components/alert/alert.js";

/**
 * Custom hook for displaying toast notifications.
 *
 * @returns {Function} toast - Function to trigger a toast notification.
 *
 * @param {string} message - The message to display in the notification.
 * @param {"primary" | "success" | "neutral" | "warning" | "danger"} [variant="primary"] - Type of notification style. It defaults to primary.
 * @param {number} [duration=3000] - Duration in milliseconds for how long the notification stays visible.
 *
 * @example
 * const toast = useToastNotification();
 * toast("Data saved successfully", "success", 2000);
 */
export const useToastNotification = () => {
  const toast = (
    message: string,
    variant:
      | "primary"
      | "success"
      | "neutral"
      | "warning"
      | "danger" = "primary",
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

  return toast;
};
