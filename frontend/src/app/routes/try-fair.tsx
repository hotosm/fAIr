import { Head } from "@/components/seo";
import { TRY_FAIR_PAGE_CONTENT } from "@/constants/ui-contents/try-fair-contents";
import { TryFairMapOutputType, TryFairResolution } from "@/enums/try-fair";
import { TryFairMap } from "@/features/try-fair/components/map/try-fair-map";
import { TryFairSidebar } from "@/features/try-fair/components/try-fair-sidebar";
import { DEMO_MODEL_CONFIGS, getDemoConfig } from "@/features/try-fair/models";
import { useMapInstance } from "@/hooks/use-map-instance";
import { useTileservice } from "@/hooks/use-tileservice";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getTileServerTypeFromURL } from "@/utils";
import { useTryFairParams } from "@/features/try-fair/hooks/use-try-fair-params";
import { useBaseModels } from "@/features/try-fair/hooks/use-base-models";
import { BBOX } from "@/types";
import { useFairPredict } from "@/features/try-fair/hooks/use-fair-predict";
import { TryFairWelcomeDialog } from "@/features/try-fair/components/try-fair-welcome-dialog";
import { getTryFairTourSteps } from "@/constants/site-tour";
import {
  getInferenceParams,
  InferenceParam,
} from "@/features/try-fair/api/stac";
import useScreenSize from "@/hooks/use-screen-size";
import { MobileDrawer } from "@/components/ui/drawer";
import {
  TRY_FAIR_TOUR_STEP_ONE_SEEN_LOCAL_STORAGE_KEY,
  TRY_FAIR_TOUR_STEP_TWO_SEEN_LOCAL_STORAGE_KEY,
  TRY_FAIR_WELCOME_DIALOG_SEEN_LOCAL_STORAGE_KEY,
} from "@/config";
import { useLocalStorage } from "@/hooks/use-storage";
import { useTour, type StepType } from "@reactour/tour";
import { TRY_FAIR_INITIAL_MAP_ZOOM } from "@/features/try-fair/utils/common";
export const TryFairPage = () => {
  const { map, mapContainerRef } = useMapInstance(false, false);
  const { isSmallViewport } = useScreenSize();
  const { getValue, setValue } = useLocalStorage();
  const { setIsOpen, setCurrentStep, setSteps } = useTour();
  const hasSeenWelcomeDialog =
    getValue(TRY_FAIR_WELCOME_DIALOG_SEEN_LOCAL_STORAGE_KEY) === "true";
  const hasSeenTourStepOne =
    getValue(TRY_FAIR_TOUR_STEP_ONE_SEEN_LOCAL_STORAGE_KEY) === "true";
  const hasSeenTourStepTwo =
    getValue(TRY_FAIR_TOUR_STEP_TWO_SEEN_LOCAL_STORAGE_KEY) === "true";

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

  const [gridZoomed, setGridZoomed] = useState<boolean>(false);
  const [mapClickCount, setMapClickCount] = useState<number>(0);
  const [showWelcomeModal, setShowWelcomeModal] = useState<boolean>(
    () => !hasSeenWelcomeDialog,
  );
  const [allowInitialPrediction, setAllowInitialPrediction] = useState<boolean>(
    () => hasSeenWelcomeDialog,
  );
  const [tourStepOneSeen, setTourStepOneSeen] = useState<boolean>(
    () => hasSeenTourStepOne,
  );
  const [tourStepTwoSeen, setTourStepTwoSeen] = useState<boolean>(
    () => hasSeenTourStepTwo,
  );
  const autoTriggeredRef = useRef<boolean>(false);

  const tileServiceUrl = demoConfig?.tileServiceUrl ?? "";

  const {
    tileserverURL,
    setTileserverURL,
    loading: tileLoading,
    tileJSONMetadata,
    tileServiceTypeValidity,
  } = useTileservice(getTileServerTypeFromURL(tileServiceUrl), tileServiceUrl);

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

  const handleGridZoom = useCallback(() => {
    setGridZoomed(true);
  }, []);

  const handleContinueToTryFair = useCallback(() => {
    setValue(TRY_FAIR_WELCOME_DIALOG_SEEN_LOCAL_STORAGE_KEY, "true");
    setShowWelcomeModal(false);
    setAllowInitialPrediction(true);
    setGridZoomed(false);

    if (map && latestBBox) {
      map.fitBounds(
        [latestBBox[0], latestBBox[1], latestBBox[2], latestBBox[3]],
        {
          padding: 40,
          essential: true,
        },
      );
      map.once("moveend", () => setGridZoomed(true));
      return;
    }

    setGridZoomed(true);
  }, [latestBBox, map, setValue]);

  const tryFairTourSteps = useMemo<StepType[]>(
    () => getTryFairTourSteps(isSmallViewport),
    [isSmallViewport],
  );

  const openTryFairTourStep = useCallback(
    (stepIndex: number) => {
      const step = tryFairTourSteps[stepIndex];
      const selector = step?.selector;
      if (!selector) return;
      if (typeof selector === "string" && !document.querySelector(selector))
        return;
      setSteps?.([step]);
      setCurrentStep(0);
      setIsOpen(true);
    },
    [setCurrentStep, setIsOpen, setSteps, tryFairTourSteps],
  );

  const handleMap = useCallback(() => {
    if (!selectedModel || !latestBBox || !demoConfig) return;
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
  useEffect(() => {
    if (autoTriggeredRef.current) return;
    if (
      !allowInitialPrediction ||
      !map ||
      !tileJSONMetadata ||
      !gridZoomed ||
      isMapButtonDisabled ||
      isPredicting
    )
      return;
    autoTriggeredRef.current = true;
    handleMap();
  }, [
    allowInitialPrediction,
    handleMap,
    map,
    tileJSONMetadata,
    gridZoomed,
    isMapButtonDisabled,
    isPredicting,
  ]);

  useEffect(() => {
    if (isPredicting || !predictions) return;
    if (mapClickCount === 1 && !tourStepOneSeen) {
      openTryFairTourStep(0);
      setValue(TRY_FAIR_TOUR_STEP_ONE_SEEN_LOCAL_STORAGE_KEY, "true");
      setTourStepOneSeen(true);
      return;
    }
    if (mapClickCount === 4 && !isSmallViewport && !tourStepTwoSeen) {
      openTryFairTourStep(1);
      setValue(TRY_FAIR_TOUR_STEP_TWO_SEEN_LOCAL_STORAGE_KEY, "true");
      setTourStepTwoSeen(true);
    }
  }, [
    isPredicting,
    predictions,
    mapClickCount,
    isSmallViewport,
    tourStepOneSeen,
    tourStepTwoSeen,
    setValue,
    openTryFairTourStep,
  ]);

  const handleOutputTypeChange = (type: TryFairMapOutputType) => {
    setOutputType(type);
    if (isDirty && predictions) {
      handleMap();
    }
  };

  return (
    <>
      <Head title={TRY_FAIR_PAGE_CONTENT.pageTitle} />
      <TryFairWelcomeDialog
        isOpened={showWelcomeModal}
        onContinue={handleContinueToTryFair}
      />

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
            onGridZoom={handleGridZoom}
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
