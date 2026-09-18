import {
  getTryFairGuidedTourSteps,
  getTryFairStartMappingStep,
} from "@/constants/site-tour";
import { TRY_FAIR_TOUR_START_MAPPING_BUTTON_SEEN_LOCAL_STORAGE_KEY } from "@/config";
import { useLocalStorage } from "@/hooks/use-storage";
import { useTour, type StepType } from "@reactour/tour";
import { useCallback, useEffect, useMemo, useState } from "react";

/** Controls the guided Try fAIr tour and the one-time Map-button prompt. */
export const useTryFairTour = (isSmallViewport: boolean) => {
  const { getValue, setValue } = useLocalStorage();
  const { setIsOpen, setCurrentStep, setSteps } = useTour();
  const [mapClickCount, setMapClickCount] = useState(0);
  const [hasSeenStartMappingStep, setHasSeenStartMappingStep] = useState(
    () =>
      getValue(TRY_FAIR_TOUR_START_MAPPING_BUTTON_SEEN_LOCAL_STORAGE_KEY) ===
      "true",
  );

  const guidedTourSteps = useMemo<StepType[]>(
    () => getTryFairGuidedTourSteps(isSmallViewport),
    [isSmallViewport],
  );
  const startMappingStep = useMemo<StepType>(
    () => getTryFairStartMappingStep(),
    [],
  );

  const openGuidedTour = useCallback(() => {
    const firstSelector = guidedTourSteps[0]?.selector;
    if (
      typeof firstSelector === "string" &&
      !document.querySelector(firstSelector)
    )
      return;

    setSteps?.(guidedTourSteps);
    setCurrentStep(0);
    setIsOpen(true);
  }, [guidedTourSteps, setCurrentStep, setIsOpen, setSteps]);

  const openStartMappingStep = useCallback(() => {
    const selector = startMappingStep.selector;
    if (typeof selector === "string" && !document.querySelector(selector))
      return;

    setSteps?.([startMappingStep]);
    setCurrentStep(0);
    setIsOpen(true);
  }, [setCurrentStep, setIsOpen, setSteps, startMappingStep]);

  const recordMapRun = useCallback(() => {
    setMapClickCount((count) => count + 1);
  }, []);

  const closeGuidedTour = useCallback(() => {
    setIsOpen(false);
  }, [setIsOpen]);

  useEffect(() => {
    if (mapClickCount !== 4 || isSmallViewport || hasSeenStartMappingStep)
      return;

    openStartMappingStep();
    setValue(TRY_FAIR_TOUR_START_MAPPING_BUTTON_SEEN_LOCAL_STORAGE_KEY, "true");
    setHasSeenStartMappingStep(true);
  }, [
    hasSeenStartMappingStep,
    isSmallViewport,
    mapClickCount,
    openStartMappingStep,
    setValue,
  ]);

  return { closeGuidedTour, openGuidedTour, recordMapRun };
};
