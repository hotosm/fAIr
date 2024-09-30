
import { createContext, useContext, useState, ReactNode } from 'react';


type TAlertContext = {
  alert: string | null;
  setAlert: (alert: string | null) => void;
};


//@ts-expect-error No need to initialize with empty object, so supressing the warning.
const AlertContext = createContext<TAlertContext>(null);

export const useAlert = () => useContext(AlertContext);

export const AlertProvider = ({ children }: { children: ReactNode }) => {
  const [alert, setAlert] = useState<string | null>(null);

  return (
    <AlertContext.Provider value={{ alert, setAlert }}>
      {children}
    </AlertContext.Provider>
  );
};

