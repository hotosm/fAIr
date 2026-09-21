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
    // Only tour elements that are actually on the page right now. Some steps
    // target items that render conditionally — Mapping Mode appears only when
    // signed in, and Share / Map Large Area live in a desktop-only header
    // cluster — so filtering by DOM presence keeps the tour from landing on a
    // missing target (which blanks reactour's popover).
    const visibleSteps = guidedTourSteps.filter(
      (step) =>
        typeof step.selector !== "string" ||
        Boolean(document.querySelector(step.selector)),
    );

    if (visibleSteps.length === 0) return;

    setSteps?.(visibleSteps);
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
