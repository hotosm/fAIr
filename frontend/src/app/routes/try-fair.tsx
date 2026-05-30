import { Head } from "@/components/seo";
import { TRY_FAIR_PAGE_CONTENT } from "@/constants/ui-contents/try-fair-contents";
import { TryFairMapOutputType, TryFairResolution } from "@/enums/try-fair";
import { TryFairMap } from "@/features/try-fair/components/map/try-fair-map";
import { TryFairSidebar } from "@/features/try-fair/components/try-fair-sidebar";
import { DEMO_MODEL_CONFIGS, getDemoConfig } from "@/features/try-fair/models";
import { useMapInstance } from "@/hooks/use-map-instance";
import { useTileservice } from "@/hooks/use-tileservice";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getTileServerTypeFromURL } from "@/utils";
import { useTryFairParams } from "@/features/try-fair/hooks/use-try-fair-params";
import { useBaseModels } from "@/features/try-fair/hooks/use-base-models";
import { BBOX } from "@/types";
import { useFairPredict } from "@/features/try-fair/hooks/use-fair-predict";
import { TryFairOnboardingDialog } from "@/features/try-fair/components/try-fair-onboarding-dialog";
import { getTryFairTourSteps } from "@/constants/site-tour";
import {
  getInferenceParams,
  InferenceParam,
} from "@/features/try-fair/api/stac";
import useScreenSize from "@/hooks/use-screen-size";
import { MobileDrawer } from "@/components/ui/drawer";
import {
  TRY_FAIR_ONBOARDING_DIALOG_SEEN_LOCAL_STORAGE_KEY,
  TRY_FAIR_TOUR_PARAMETERS_ADJUSTMENTS_SEEN_LOCAL_STORAGE_KEY,
  TRY_FAIR_TOUR_START_MAPPING_BUTTON_SEEN_LOCAL_STORAGE_KEY,
  TRY_FAIR_TOUR_MAP_BUTTON_TOOLTIP_LOCAL_STORAGE_KEY,
} from "@/config";
import { useLocalStorage } from "@/hooks/use-storage";
import { useTour, type StepType } from "@reactour/tour";
import { TRY_FAIR_INITIAL_MAP_ZOOM } from "@/features/try-fair/utils/common";

export const TryFairPage = () => {
  const { map, mapContainerRef } = useMapInstance(false, false);
  const { isSmallViewport } = useScreenSize();
  const { getValue, setValue } = useLocalStorage();
  const { setIsOpen: setIsSiteTourOpen, setCurrentStep, setSteps } = useTour();

  const {
    modelId,
    outputType,
    resolution,
    confidence,
    setModelId,
    setOutputType,
    setResolution,
    setConfidence,
  } = useTryFairParams();

  const { models: allModels, loading: modelsLoading } = useBaseModels();

  const models = useMemo(
    () =>
      DEMO_MODEL_CONFIGS.flatMap((cfg) =>
        allModels.filter((m) => m.id === cfg.baseModelId),
      ),
    [allModels],
  );

  const selectedModel = useMemo(
    () => models.find((m) => m.id === modelId) ?? null,
    [models, modelId],
  );

  const demoConfig = useMemo(
    () => (selectedModel ? getDemoConfig(selectedModel.id) : undefined),
    [selectedModel],
  );

  const inferenceParams: InferenceParam[] = useMemo(
    () => (selectedModel ? getInferenceParams(selectedModel) : []),
    [selectedModel],
  );

  const paramValues = useMemo(() => {
    const values: Record<string, number | string | boolean> = {};
    inferenceParams.forEach(({ key, spec }) => {
      values[key] = key === "confidence_threshold" ? confidence : spec.default;
    });
    return values;
  }, [inferenceParams, confidence]);

  const [latestBBox, setLatestBBox] = useState<BBOX | null>(null);

  const [latestGridZoom, setLatestGridZoom] = useState<number | null>(null);
  const [isDirty, setIsDirty] = useState<boolean>(true);

  const [mapClickCount, setMapClickCount] = useState<number>(0);

  const hasSeenOnboardingDialog =
    getValue(TRY_FAIR_ONBOARDING_DIALOG_SEEN_LOCAL_STORAGE_KEY) === "true";

  const [showOnboarding, setShowOnboarding] = useState<boolean>(
    () => !hasSeenOnboardingDialog,
  );

  // Site Tours
  const [tourStepMapButtonTooltipSeen, setTourStepMapButtonTooltipSeen] =
    useState<boolean>(
      () =>
        getValue(TRY_FAIR_TOUR_MAP_BUTTON_TOOLTIP_LOCAL_STORAGE_KEY) === "true",
    );
  const [
    tourStepParametersAdjustmentsSeen,
    setTourStepParametersAdjustmentsSeen,
  ] = useState<boolean>(
    () =>
      getValue(TRY_FAIR_TOUR_PARAMETERS_ADJUSTMENTS_SEEN_LOCAL_STORAGE_KEY) ===
      "true",
  );

  const [tourStepStartMappingButtonSeen, setTourStepStartMappingButtonSeen] =
    useState<boolean>(
      () =>
        getValue(TRY_FAIR_TOUR_START_MAPPING_BUTTON_SEEN_LOCAL_STORAGE_KEY) ===
        "true",
    );

  const tileServiceUrl = demoConfig?.tileServiceUrl ?? "";

  const {
    tileserverURL,
    setTileserverURL,
    loading: tileLoading,
    tileJSONMetadata,
    tileServiceTypeValidity,
  } = useTileservice(getTileServerTypeFromURL(tileServiceUrl), tileServiceUrl);

  // Site tour trigger logic based on map interactions and prediction state.
  const GRID_ZOOM_IN_DURATION = 1500;

  // Zoom to grid and fit the map to the grid bbox.
  const handleZoomToGrid = useCallback(() => {
    if (map && latestBBox) {
      // This is to prevent the users from interrupting the flyTo animation.
      map.dragPan.disable();
      map.scrollZoom.disable();
      map.boxZoom.disable();
      map.dragRotate.disable();
      map.touchZoomRotate.disable();
      map.fitBounds(
        [latestBBox[0], latestBBox[1], latestBBox[2], latestBBox[3]],
        {
          padding: 40,
          duration: GRID_ZOOM_IN_DURATION,
          essential: true,
        },
      );
      map.once("moveend", () => {
        map.dragPan.enable();
        map.scrollZoom.enable();
        map.boxZoom.enable();
        map.dragRotate.enable();
        map.touchZoomRotate.enable();
      });
      return;
    }
  }, [latestBBox, map]);

  useEffect(() => {
    setTileserverURL(tileServiceUrl);
  }, [tileServiceUrl, setTileserverURL]);

  const imageryCenter = useMemo((): [number, number] | undefined => {
    if (tileJSONMetadata?.center) {
      return [tileJSONMetadata.center[0], tileJSONMetadata.center[1]];
    }
    if (tileJSONMetadata?.bounds) {
      const b = tileJSONMetadata.bounds as [number, number, number, number];
      return [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2];
    }
    return demoConfig?.center;
  }, [tileJSONMetadata, demoConfig]);

  useEffect(() => {
    if (showOnboarding) return;
    if (!map || !demoConfig || !imageryCenter) return;
    const doFly = () => {
      map.flyTo({
        center: imageryCenter,
        zoom: TRY_FAIR_INITIAL_MAP_ZOOM,
        essential: true,
      });
    };
    if (map.isStyleLoaded()) {
      doFly();
    } else {
      map.once("load", doFly);
      return () => {
        map.off("load", doFly);
      };
    }
  }, [map, demoConfig, imageryCenter]);

  const {
    predict,
    isPredicting,
    predictions,
    predictionBBox,
    predictionGridZoom,
    clearPredictions,
  } = useFairPredict();

  const handleSelectModel = (model: { id: string }) => {
    setModelId(model.id);
    setResolution(TryFairResolution.MID);
    setIsDirty(true);
    clearPredictions();
  };

  const handleResolutionChange = (res: TryFairResolution) => {
    setResolution(res);
    setIsDirty(true);
  };

  const handleParamChange = useCallback(
    (key: string, value: number | string | boolean) => {
      if (key === "confidence_threshold") setConfidence(value as number);
      setIsDirty(true);
    },
    [setConfidence],
  );

  const handleBBoxChange = useCallback((bbox: BBOX, tileZoom: number) => {
    setLatestBBox(bbox);
    setLatestGridZoom(tileZoom);
    setIsDirty(true);
  }, []);

  const tryFairTourSteps = useMemo<StepType[]>(
    () => getTryFairTourSteps(isSmallViewport),
    [isSmallViewport],
  );

  const openTryFairTourStep = useCallback(
    (stepIndex: number | number[]) => {
      const steps = Array.isArray(stepIndex)
        ? stepIndex.map((i) => tryFairTourSteps[i])
        : [tryFairTourSteps[stepIndex]];
      const selector = steps[0]?.selector;
      if (!selector) return;
      if (typeof selector === "string" && !document.querySelector(selector))
        return;
      setSteps?.(steps);
      setCurrentStep(0);
      setIsSiteTourOpen(true);
    },
    [setCurrentStep, setIsSiteTourOpen, setSteps, tryFairTourSteps],
  );

  const handleMap = useCallback(() => {
    if (!selectedModel || !latestBBox || !demoConfig) return;

    // Clear Map button tour step if it's still active.
    if (tourStepMapButtonTooltipSeen) {
      setIsSiteTourOpen(false);
    }

    setIsDirty(false);
    setMapClickCount((n) => n + 1);
    const apiParams = Object.fromEntries(
      Object.entries(paramValues).map(([parameterName, parameterValue]) =>
        parameterName === "confidence_threshold"
          ? [parameterName, parseFloat((1 - Number(parameterValue)).toFixed(2))]
          : [parameterName, parameterValue],
      ),
    );
    predict({
      model: selectedModel,
      localModelUri: demoConfig.localModelUri,
      tileServiceUrl: tileserverURL,
      bbox: latestBBox,
      gridZoom: latestGridZoom ?? undefined,
      resolution,
      params: apiParams,
    });
  }, [
    selectedModel,
    latestBBox,
    demoConfig,
    paramValues,
    predict,
    tileserverURL,
    latestGridZoom,
    resolution,
  ]);

  const isMapButtonDisabled = !isDirty || !latestBBox || !demoConfig;

  // Site tour trigger logic based on map interactions and prediction state.
  useEffect(() => {
    if (hasSeenOnboardingDialog && !tourStepMapButtonTooltipSeen) {
      const timer = setTimeout(() => {
        openTryFairTourStep(0);
        setValue(TRY_FAIR_TOUR_MAP_BUTTON_TOOLTIP_LOCAL_STORAGE_KEY, "true");
        setTourStepMapButtonTooltipSeen(true);
      }, GRID_ZOOM_IN_DURATION + 200); // Delay to ensure it doesn't conflict with the zoom animation.

      return () => clearTimeout(timer);
    }
    // Only show this a few ms after predictions has been returned.
    if (
      mapClickCount === 1 &&
      !tourStepParametersAdjustmentsSeen &&
      predictions
    ) {
      const timer = setTimeout(() => {
        // Showing the second and third here because we have to nudge them to rerun the map button again to see the changes.
        openTryFairTourStep([1, 2]);
        setValue(
          TRY_FAIR_TOUR_PARAMETERS_ADJUSTMENTS_SEEN_LOCAL_STORAGE_KEY,
          "true",
        );
        setTourStepParametersAdjustmentsSeen(true);
      }, 1000);
      return () => clearTimeout(timer);
    }

    // Show the start mapping trigger after the user has clicked the map button a few times.
    if (
      mapClickCount === 4 &&
      !isSmallViewport &&
      !tourStepStartMappingButtonSeen
    ) {
      openTryFairTourStep(3);
      setValue(
        TRY_FAIR_TOUR_START_MAPPING_BUTTON_SEEN_LOCAL_STORAGE_KEY,
        "true",
      );
      setTourStepStartMappingButtonSeen(true);
    }
  }, [
    hasSeenOnboardingDialog,
    tourStepMapButtonTooltipSeen,
    mapClickCount,
    isSmallViewport,
    tourStepParametersAdjustmentsSeen,
    tourStepStartMappingButtonSeen,
    openTryFairTourStep,
    setValue,
    predictions,
  ]);

  const handleOutputTypeChange = (type: TryFairMapOutputType) => {
    setOutputType(type);
    if (isDirty && predictions) {
      handleMap();
    }
  };

  const closeOnboarding = () => {
    localStorage.setItem(
      TRY_FAIR_ONBOARDING_DIALOG_SEEN_LOCAL_STORAGE_KEY,
      "true",
    );
    setShowOnboarding(false);
    // Zoom to the grid after the onboarding dialog is closed or skipped.
    handleZoomToGrid();
  };

  return (
    <>
      <Head title={TRY_FAIR_PAGE_CONTENT.pageTitle} />
      {showOnboarding && (
        <TryFairOnboardingDialog
          isOpened={showOnboarding}
          onContinue={closeOnboarding}
          handleSkipOnboarding={closeOnboarding}
        />
      )}

      <div className="flex h-screen md:h-[92vh] flex-col fullscreen">
        <div className="flex-grow relative">
          <TryFairMap
            map={map}
            mapContainerRef={mapContainerRef}
            outputType={outputType}
            tileServerURL={tileserverURL}
            tileLoading={tileLoading}
            tileServiceValid={tileServiceTypeValidity.valid}
            onBBoxChange={handleBBoxChange}
            predictions={predictions}
            predictionBBox={predictionBBox}
            predictionGridZoom={predictionGridZoom}
            imageryCenter={imageryCenter}
            resolution={resolution}
            modelId={modelId}
            isPredicting={isPredicting}
          />

          {!isSmallViewport && (
            <div className="absolute top-4 left-4 z-10">
              <TryFairSidebar
                selectedModel={selectedModel}
                models={models}
                modelsLoading={modelsLoading}
                onSelectModel={handleSelectModel}
                outputType={outputType}
                onOutputTypeChange={handleOutputTypeChange}
                resolution={resolution}
                onResolutionChange={handleResolutionChange}
                inferenceParams={inferenceParams}
                paramValues={paramValues}
                onParamChange={handleParamChange}
                onMap={handleMap}
                isPredicting={isPredicting}
                isMapButtonDisabled={isMapButtonDisabled}
              />
            </div>
          )}

          {isSmallViewport && (
            <div className="relative">
              <MobileDrawer
                open={isSmallViewport}
                dialogTitle="Try Fair Settings"
                snapPoints={[0.2, 0.9]}
                modal={false}
                showOverlay={false}
                handleOnly
              >
                <TryFairSidebar
                  selectedModel={selectedModel}
                  models={models}
                  modelsLoading={modelsLoading}
                  onSelectModel={handleSelectModel}
                  outputType={outputType}
                  onOutputTypeChange={handleOutputTypeChange}
                  resolution={resolution}
                  onResolutionChange={handleResolutionChange}
                  inferenceParams={inferenceParams}
                  paramValues={paramValues}
                  onParamChange={handleParamChange}
                  onMap={handleMap}
                  isPredicting={isPredicting}
                  isMapButtonDisabled={isMapButtonDisabled}
                  className="w-full shadow-none"
                />
              </MobileDrawer>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
