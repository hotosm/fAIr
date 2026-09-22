import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { useLocalStorage } from "@/hooks/use-storage";
import { useTour } from "@reactour/tour";
import { useLocation } from "react-router-dom";
import { MODELS_ROUTES } from "@/constants";
import { TRAINING_AREA_TOUR_LOCAL_STORAGE_KEY } from "@/config";
import { APP_TOUR_STEPS } from "@/constants/site-tour";

type TTourContext = {
  startTrainingAreaTour: () => void;
  stopTrainingAreaTour: () => void;
  showTourModal: boolean;
  setShowTourModal: (show: boolean) => void;
};

const AppTourContext = createContext<TTourContext>({
  startTrainingAreaTour: () => {},
  stopTrainingAreaTour: () => {},
  showTourModal: false,
  setShowTourModal: () => {},
});

export const useAppTour = () => {
  const context = useContext(AppTourContext);
  if (!context) {
    throw new Error("useAppTour must be used within an AuthProvider");
  }
  return context;
};

type AppTourProviderProps = {
  children: React.ReactNode;
};

export const AppTourProvider: React.FC<AppTourProviderProps> = ({
  children,
}) => {
  const { setIsOpen, setCurrentStep, setSteps } = useTour();
  const { getValue, setValue } = useLocalStorage();
  const [showTourModal, setShowTourModal] = useState<boolean>(false);
  const location = useLocation();
  const tourStatus = getValue(TRAINING_AREA_TOUR_LOCAL_STORAGE_KEY);

  const startTrainingAreaTour = useCallback(() => {
    setShowTourModal(false);
    setIsOpen(true);
    // @ts-expect-error bad types definition
    setSteps((prevSteps) => {
      const visibleSteps = APP_TOUR_STEPS.filter((step) =>
        document.querySelector(step.selector),
      );
      return visibleSteps;
    });
    setCurrentStep(0);
    setValue(TRAINING_AREA_TOUR_LOCAL_STORAGE_KEY, "true");
  }, [setIsOpen, setCurrentStep, setShowTourModal]);

  const stopTrainingAreaTour = useCallback(() => {
    setIsOpen(false);
    setShowTourModal(false);
    setValue(TRAINING_AREA_TOUR_LOCAL_STORAGE_KEY, "false");
  }, [setIsOpen, setCurrentStep]);

  useEffect(() => {
    if (location.pathname.includes(MODELS_ROUTES.TRAINING_AREA)) {
      if (!tourStatus || tourStatus === "false") {
        setShowTourModal(true);
      }
    } else {
      setShowTourModal(false);
    }
  }, [location.pathname, tourStatus]);

  return (
    <AppTourContext.Provider
      value={{
        startTrainingAreaTour,
        stopTrainingAreaTour,
        showTourModal,
        setShowTourModal,
      }}
    >
      {children}
    </AppTourContext.Provider>
  );
};
