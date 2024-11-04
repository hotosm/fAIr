
export const useToastNotification = () => {
    const toast = (message: string, variant: "primary" | "success" | "neutral" | "warning" | "danger" = "primary", duration: number = 3000) => {
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
    }

    return toast
};