import { Head } from "@/components/seo";
import { TRY_FAIR_PAGE_CONTENT } from "@/constants/ui-contents/try-fair-contents";
import { ModelType, TryFairMapOutputType, TryFairResolution } from "@/enums";
import { TryFairMap } from "@/features/try-fair/components/map/try-fair-map";
import { TryFairSidebar } from "@/features/try-fair/components/try-fair-sidebar";
import { ModelPickerContent } from "@/features/try-fair/components/model-picker-modal";
import { getSelectedModel } from "@/features/try-fair/utils/models";
import { useMapInstance } from "@/hooks/use-map-instance";
import { useTileservice } from "@/hooks/use-tileservice";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getTileServerRegex,
  getTileServerTypeFromURL,
  showErrorToast,
} from "@/utils";
import { useTryFairParams } from "@/features/try-fair/hooks/use-try-fair-params";
import {
  useBaseModels,
  useLocalModels,
} from "@/features/try-fair/hooks/use-base-models";
import { BBOX, Feature } from "@/types";
import { showSuccessToast } from "@/utils";
import { MapLargeAreaModal } from "@/features/try-fair/components/start-mapping/map-large-area-modal";
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
  getModelOutputType,
  TRY_FAIR_INITIAL_MAP_ZOOM,
} from "@/features/try-fair/utils/common";
import { Dialog } from "@/components/ui/dialog";
import { useDialog } from "@/hooks/use-dialog";
import { ImageryLocationDialog } from "@/features/try-fair/components/imagery/imagery-location-modal";
import { useStartMappingStore } from "@/features/try-fair/utils/start-mapping-store";
import { SignInPromptDialog } from "@/features/try-fair/components/modals/sign-in-prompt";
import { useNavigate } from "react-router-dom";
import { APPLICATION_ROUTES } from "@/constants";
import { DISABLE_AUTH_ON_TRY_FAIR } from "@/config";

export const TryFairPage = () => {
  const { map, mapContainerRef } = useMapInstance(false, false);
  const { isSmallViewport } = useScreenSize();
  const {
    showChooseLocationModal,
    setShowChooseLocationModal,
    showSigninModal,
    setShowSigninModal,
    currentModelType,
    setCurrentModelType,
    setSeletedImagery,
    selectedImagery,
    downloadType,
    setDownloadType,
    setPredictions: setPredictionsInStore,
    setPredictionBBox: setPredictionBBoxInStore,
    setPredictionGridZoom: setPredictionGridZoomInStore,
    setOutputType: setOutputTypeInStore,
  } = useStartMappingStore();
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
    isParametersDefault,
    resetParameters,
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

  // Snapshot of the current prediction inputs vs what was last submitted,
  const lastPredictedInputsRef = useRef<string | null>(null);

  const predictionInputsSnapshot = useMemo(() => {
    if (!latestBBox || !modelId) return null;
    return JSON.stringify({
      modelId,
      bbox: latestBBox,
      gridZoom: latestGridZoom,
      resolution,
      paramValues,
    });
  }, [modelId, latestBBox, latestGridZoom, resolution, paramValues]);

  const isDirty =
    predictionInputsSnapshot === null ||
    predictionInputsSnapshot !== lastPredictedInputsRef.current;

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
    const modelImagery =
      currentModelType === ModelType.DEMO
        ? selectedModel?.properties["fair:source_imagery"]
        : selectedImagery?.tileUrl;
    if (!modelImagery) return FALLBACK_FAIR_IMAGERY;
    const regex = getTileServerRegex(getTileServerTypeFromURL(modelImagery));
    return regex.test(modelImagery) ? modelImagery : FALLBACK_FAIR_IMAGERY;
  }, [selectedModel, currentModelType, selectedImagery]);

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
    // A selected imagery's own bounds take priority, so applying imagery
    // re-centers the map on it (OAM XYZ tiles carry no TileJSON center).
    if (selectedImagery?.bounds) {
      const [w, s, e, n] = selectedImagery.bounds;
      return [(w + e) / 2, (s + n) / 2];
    }
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
  }, [tileJSONMetadata, tileServiceUrl, selectedImagery, selectedModel]);

  // The current imagery's extent, used as the "Whole Imagery" AOI in the
  // Map Large Area modal.
  const imageryBounds = useMemo<BBOX | null>(() => {
    if (selectedImagery?.bounds) return selectedImagery.bounds;
    if (tileJSONMetadata?.bounds) return tileJSONMetadata.bounds as BBOX;
    return null;
  }, [selectedImagery, tileJSONMetadata]);

  // Map Large Area (Export → Map Large Area). Opens when downloadType is set to
  const navigate = useNavigate();
  const largeAreaAOIRef = useRef<Feature | null>(null);
  const handleLargeAreaSubmit = (aoi: Feature) => {
    largeAreaAOIRef.current = aoi;
    showSuccessToast("Area selected for mapping.");
    setDownloadType("");
    navigate(APPLICATION_ROUTES.PROFILE_OFFLINE_PREDICTIONS);
  };
  const mapFlownRef = useRef(false);
  useEffect(() => {
    if (!map || !selectedModel || !imageryCenter) return;
    const doFly = () => {
      mapFlownRef.current = true;
      map.flyTo({
        center: imageryCenter,
        zoom: TRY_FAIR_INITIAL_MAP_ZOOM,
        essential: true,
      });
    };
    // After the first successful fly, fly directly on every center change.
    // `isStyleLoaded()` transiently reports false while a newly-applied imagery
    // source loads, and the map's one-shot `load` event has already fired — so
    // re-gating on it here would trap the camera and it would never move.
    if (mapFlownRef.current || map.isStyleLoaded()) {
      doFly();
    } else {
      map.once("load", doFly);
      return () => {
        map.off("load", doFly);
      };
    }
  }, [map, selectedModel, imageryCenter]);

  useEffect(() => {
    if (
      selectedModel &&
      getModelOutputType(selectedModel) === TryFairMapOutputType.POINTS &&
      outputType === TryFairMapOutputType.POLYGON
    ) {
      setOutputType(TryFairMapOutputType.POINTS);
    }
  }, [selectedModel, outputType, setOutputType]);

  const {
    predict,
    isPredicting,
    predictions,
    predictionBBox,
    predictionGridZoom,
    clearPredictions,
    error,
  } = useFairPredict();

  const handleSelectModel = (model: BaseModelStacItem) => {
    setModelId(model.id);
    setCurrentModelType(ModelType.DEMO);
    setResolution(TryFairResolution.MID);

    // Reset confidence threshold to model's spec default if available
    const infParams = getInferenceParams(model);
    const confidenceParam = infParams.find(
      (p) => p.key === "confidence_threshold",
    );
    if (confidenceParam && typeof confidenceParam.spec.default === "number") {
      setConfidence(confidenceParam.spec.default);
    }
    setOutputType(getModelOutputType(model));
    // Invalidate so the Map button re-enables for the new model
    lastPredictedInputsRef.current = null;
    clearPredictions();
  };

  const handleResolutionChange = (res: TryFairResolution) => {
    setResolution(res);
  };

  const handleParamChange = useCallback(
    (key: string, value: number | string | boolean) => {
      if (key === "confidence_threshold") setConfidence(value as number);
    },
    [setConfidence],
  );

  const handleBBoxChange = useCallback((bbox: BBOX, tileZoom: number) => {
    setLatestBBox(bbox);
    setLatestGridZoom(tileZoom);
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
    // Save what we just submitted so we can detect duplicate runs
    lastPredictedInputsRef.current = predictionInputsSnapshot;
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
    if (error) {
      console.log(error);
      showErrorToast(error);
    }
  }, [
    selectedModel,
    latestBBox,
    demoConfig,
    paramValues,
    predict,
    tileserverURL,
    latestGridZoom,
    resolution,
    predictionInputsSnapshot,
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
    setOutputTypeInStore(type);
    if (isDirty && predictions) {
      handleMap();
    }
  };

  // Sync prediction state into the global store so the navbar Export button can access it.
  useEffect(() => {
    setPredictionsInStore(predictions);
    setPredictionBBoxInStore(predictionBBox);
    setPredictionGridZoomInStore(predictionGridZoom);
  }, [predictions, predictionBBox, predictionGridZoom]);
  return (
    <>
      <Head title={TRY_FAIR_PAGE_CONTENT.pageTitle} />

      {/* Model picker dialog – rendered at page level so it's not trapped inside MobileDrawer */}
      <Dialog
        label="Where do you want to map?"
        isOpened={isModelPickerDialogOpened}
        closeDialog={closeModelPickerDialog}
      >
        <ModelPickerContent
          selectedModel={selectedModel}
          onSelect={handleSelectModel}
          models={models}
          onClose={closeModelPickerDialog}
        />
      </Dialog>

      {/* Imagery/location dialog – rendered at page level */}
      <ImageryLocationDialog
        isOpened={showChooseLocationModal}
        closeDialog={() => setShowChooseLocationModal(false)}
        onApply={(selection) => {
          setCurrentModelType(ModelType.IMAGERY);
          setSeletedImagery(selection);
          // Invalidate the last prediction so the Map button re-enables and
          // stale predictions clear when the imagery changes. The map re-centers
          // on the new imagery via the imageryCenter/flyTo effect.
          lastPredictedInputsRef.current = null;
          clearPredictions();
          setShowChooseLocationModal(false);
        }}
      />
      {!DISABLE_AUTH_ON_TRY_FAIR && (
        <SignInPromptDialog
          isOpened={showSigninModal}
          closeDialog={() => setShowSigninModal(false)}
        />
      )}

      {/* Map Large Area (Export → Map Large Area) */}
      <MapLargeAreaModal
        isOpened={downloadType === "large-area"}
        closeDialog={() => setDownloadType("")}
        tileServerURL={tileserverURL}
        imageryBounds={imageryBounds}
        onSubmit={handleLargeAreaSubmit}
      />

      {/* Signin Prompt */}

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
                onResetParameters={resetParameters}
                isParametersDefault={isParametersDefault}
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
                  onResetParameters={resetParameters}
                  isParametersDefault={isParametersDefault}
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
