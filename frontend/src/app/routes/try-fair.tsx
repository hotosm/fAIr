import { Head } from "@/components/seo";
import { TRY_FAIR_PAGE_CONTENT } from "@/constants/ui-contents/try-fair-contents";
import { TryFairMapOutputType, TryFairResolution } from "@/enums/try-fair";
import { TryFairMap } from "@/features/try-fair/components/map/try-fair-map";
import { TryFairSidebar } from "@/features/try-fair/components/try-fair-sidebar";
import { ModelPickerContent } from "@/features/try-fair/components/model-picker-modal";
import { getSelectedModel } from "@/features/try-fair/utils/models";
import { useMapInstance } from "@/hooks/use-map-instance";
import { useTileservice } from "@/hooks/use-tileservice";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getTileServerRegex, getTileServerTypeFromURL } from "@/utils";
import { useTryFairParams } from "@/features/try-fair/hooks/use-try-fair-params";
import {
  useBaseModels,
  useLocalModels,
} from "@/features/try-fair/hooks/use-base-models";
import { BBOX } from "@/types";
import { useFairPredict } from "@/features/try-fair/hooks/use-fair-predict";
import {
  getTryFairGuidedTourSteps,
  getTryFairStartMappingStep,
} from "@/constants/site-tour";
import {
  BaseModelStacItem,
  getInferenceParams,
  InferenceParam,
} from "@/features/try-fair/api/stac";
import useScreenSize from "@/hooks/use-screen-size";
import { MobileDrawer } from "@/components/ui/drawer";
import { TRY_FAIR_TOUR_START_MAPPING_BUTTON_SEEN_LOCAL_STORAGE_KEY } from "@/config";
import { useLocalStorage } from "@/hooks/use-storage";
import { useTour, type StepType } from "@reactour/tour";
import {
  DEFAULT_FAIR_IMAGERY_CENTER,
  FALLBACK_FAIR_IMAGERY,
  FALLBACK_FAIR_IMAGERY_CENTER,
  TRY_FAIR_INITIAL_MAP_ZOOM,
} from "@/features/try-fair/utils/common";
import { Dialog } from "@/components/ui/dialog";
import { useDialog } from "@/hooks/use-dialog";

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
  const { models: localModels, loading: localModelLoading } = useLocalModels();

  const models = useMemo(
    () => [...allModels, ...localModels],
    [allModels, localModels],
  );
  const selectedModel = useMemo(
    () => getSelectedModel(models, modelId),
    [models, modelId],
  );
  const demoConfig = useMemo(
    () =>
      selectedModel ? getSelectedModel(models, selectedModel.id) : undefined,
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

  const {
    openDialog: openModelPickerDialog,
    isOpened: isModelPickerDialogOpened,
    closeDialog: closeModelPickerDialog,
  } = useDialog();

  const [mapClickCount, setMapClickCount] = useState<number>(0);

  const [tourStepStartMappingButtonSeen, setTourStepStartMappingButtonSeen] =
    useState<boolean>(
      () =>
        getValue(TRY_FAIR_TOUR_START_MAPPING_BUTTON_SEEN_LOCAL_STORAGE_KEY) ===
        "true",
    );

  const tileServiceUrl = useMemo(() => {
    const modelImagery = selectedModel?.properties["fair:source_imagery"];
    if (!modelImagery) return FALLBACK_FAIR_IMAGERY;
    const regex = getTileServerRegex(getTileServerTypeFromURL(modelImagery));
    return regex.test(modelImagery) ? modelImagery : FALLBACK_FAIR_IMAGERY;
  }, [selectedModel]);
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
      map.touchPitch.disable();
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
        map.touchPitch.enable();
      });
      return;
    }
  }, [latestBBox, map]);

  useEffect(() => {
    setTileserverURL(tileServiceUrl);
  }, [tileServiceUrl, setTileserverURL]);

  const imageryCenter = useMemo((): [number, number] => {
    const previewLocation = selectedModel?.properties["fair:preview_location"];
    if (previewLocation) {
      return previewLocation.coordinates;
    }
    if (tileJSONMetadata?.center) {
      return [tileJSONMetadata.center[0], tileJSONMetadata.center[1]];
    }
    if (tileJSONMetadata?.bounds) {
      const [w, s, e, n] = tileJSONMetadata.bounds as [
        number,
        number,
        number,
        number,
      ];
      return [(w + e) / 2, (s + n) / 2];
    }
    return tileServiceUrl === FALLBACK_FAIR_IMAGERY
      ? FALLBACK_FAIR_IMAGERY_CENTER
      : DEFAULT_FAIR_IMAGERY_CENTER;
  }, [tileJSONMetadata, tileServiceUrl, selectedModel]);

  useEffect(() => {
    if (!map || !selectedModel || !imageryCenter) return;
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
  }, [map, selectedModel, imageryCenter]);
  const {
    predict,
    isPredicting,
    predictions,
    predictionBBox,
    predictionGridZoom,
    clearPredictions,
  } = useFairPredict();

  const handleSelectModel = (model: BaseModelStacItem) => {
    setModelId(model.id);
    setResolution(TryFairResolution.MID);

    // Reset confidence threshold to model's spec default if available
    const infParams = getInferenceParams(model);
    const confidenceParam = infParams.find(
      (p) => p.key === "confidence_threshold",
    );
    if (confidenceParam && typeof confidenceParam.spec.default === "number") {
      setConfidence(confidenceParam.spec.default);
    }
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
    setIsSiteTourOpen(true);
  }, [guidedTourSteps, setCurrentStep, setIsSiteTourOpen, setSteps]);

  const openStartMappingStep = useCallback(() => {
    const selector = startMappingStep.selector;
    if (typeof selector === "string" && !document.querySelector(selector))
      return;
    setSteps?.([startMappingStep]);
    setCurrentStep(0);
    setIsSiteTourOpen(true);
  }, [startMappingStep, setCurrentStep, setIsSiteTourOpen, setSteps]);

  const handleMap = useCallback(() => {
    if (!selectedModel || !latestBBox || !demoConfig) return;

    setIsSiteTourOpen(false);
    // Always centerlize the grid whenever the user clicks on Map
    // This is to prevent situations whereby the user drags the grid to another place and the prediction is not visible to them.
    handleZoomToGrid();
    setIsDirty(false);
    setMapClickCount((n) => n + 1);
    const apiParams = Object.fromEntries(
      Object.entries(paramValues).map(([parameterName, parameterValue]) =>
        parameterName === "confidence_threshold"
          ? [parameterName, parseFloat(Number(parameterValue).toFixed(2))]
          : [parameterName, parameterValue],
      ),
    );
    predict({
      model: selectedModel,
      localModelUri: selectedModel?.assets?.model?.href ?? "",
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
    if (
      mapClickCount === 4 &&
      !isSmallViewport &&
      !tourStepStartMappingButtonSeen
    ) {
      openStartMappingStep();
      setValue(
        TRY_FAIR_TOUR_START_MAPPING_BUTTON_SEEN_LOCAL_STORAGE_KEY,
        "true",
      );
      setTourStepStartMappingButtonSeen(true);
    }
  }, [
    mapClickCount,
    isSmallViewport,
    tourStepStartMappingButtonSeen,
    openStartMappingStep,
    setValue,
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

      {/* Model picker dialog – rendered at page level so it's not trapped inside MobileDrawer */}
      <Dialog
        label="Choose a Model"
        isOpened={isModelPickerDialogOpened}
        closeDialog={closeModelPickerDialog}
      >
        <ModelPickerContent
          selectedModel={selectedModel}
          onSelect={(model) => {
            handleSelectModel(model);
            closeModelPickerDialog();
          }}
          models={models}
        />
      </Dialog>

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
            canFitToBounds={true}
            onHelp={openGuidedTour}
          />

          {!isSmallViewport && (
            <div className="absolute top-4 left-4 z-10">
              <TryFairSidebar
                selectedModel={selectedModel}
                models={models}
                modelsLoading={modelsLoading || localModelLoading}
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
                snapPoints={[0.2, 0.7]}
                modal={false}
                showOverlay={false}
                handleOnly
              >
                <TryFairSidebar
                  selectedModel={selectedModel}
                  models={models}
                  modelsLoading={modelsLoading || localModelLoading}
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
                  openMobileModelPickerDialog={openModelPickerDialog}
                />
              </MobileDrawer>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
