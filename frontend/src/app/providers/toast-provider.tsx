import { createContext, useContext, ReactNode } from "react";
import "@shoelace-style/shoelace/dist/components/alert/alert.js";

type TToastContext = {
  notify: (
    message: string,
    variant?: "primary" | "success" | "neutral" | "warning" | "danger",
    duration?: number,
  ) => void;
};

//@ts-expect-error bad type definition
const ToastContext = createContext<TToastContext>(null);

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const notify = (message: string, variant = "primary", duration = 3000) => {
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

  return (
    <ToastContext.Provider value={{ notify }}>{children}</ToastContext.Provider>
  );
};
