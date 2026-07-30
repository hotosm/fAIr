import { Head } from "@/components/seo";
import { TRY_FAIR_PAGE_CONTENT } from "@/constants/ui-contents/try-fair-contents";
import {
  ImagerySource,
  ModelType,
  TryFairMapOutputType,
  TryFairResolution,
} from "@/enums";
import { TryFairMap } from "@/features/try-fair/components/map/try-fair-map";
import { TryFairSidebar } from "@/features/try-fair/components/try-fair-sidebar";
import { ModelPickerContent } from "@/features/try-fair/components/model-picker-modal";
import { getSelectedModel } from "@/features/try-fair/utils/models";
import { useMapInstance } from "@/hooks/use-map-instance";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { showErrorToast } from "@/utils";
import { useTryFairParams } from "@/features/try-fair/hooks/use-try-fair-params";
import {
  useStacBaseModels,
  useStacLocalModels,
} from "@/features/try-fair/hooks/use-base-models";
import { BBOX } from "@/types";
import { MapLargeAreaModal } from "@/features/try-fair/components/start-mapping/map-large-area-modal";
import { useFairPredict } from "@/features/try-fair/hooks/use-fair-predict";
import { useTryFairImagery } from "@/features/try-fair/hooks/use-try-fair-imagery";
import { useTryFairTour } from "@/features/try-fair/hooks/use-try-fair-tour";
import {
  BaseModelStacItem,
  getInferenceParams,
} from "@/features/try-fair/api/stac";
import { useImageryMappingModel } from "@/features/try-fair/hooks/use-imagery-mapping-model";
import useScreenSize from "@/hooks/use-screen-size";
import { MobileDrawer } from "@/components/ui/drawer";
import { getModelOutputType } from "@/features/try-fair/utils/common";
import { Dialog } from "@/components/ui/dialog";
import { useDialog } from "@/hooks/use-dialog";
import { ImageryLocationDialog } from "@/features/try-fair/components/imagery/imagery-location-modal";
import { useStartMappingStore } from "@/features/try-fair/utils/start-mapping-store";
import { SignInPromptDialog } from "@/features/try-fair/components/modals/sign-in-prompt";
import { DISABLE_AUTH_ON_TRY_FAIR } from "@/config";
import type { ImagerySelection } from "@/features/try-fair/types/imagery-types";
import { MapLargeAreaRequestSuccess } from "@/features/try-fair/components/start-mapping/map-large-area-request-success-dialog";
import { useShallow } from "zustand/react/shallow";

export const TryFairPage = () => {
  const { map, mapContainerRef } = useMapInstance(false, false);
  const { isSmallViewport } = useScreenSize();
  const {
    showChooseLocationModal,
    setShowChooseLocationModal,
    showSigninModal,
    setShowSigninModal,
    downloadType,
    setDownloadType,
    setPredictions: setPredictionsInStore,
    setPredictionBBox: setPredictionBBoxInStore,
    setPredictionGridZoom: setPredictionGridZoomInStore,
    setOutputType: setOutputTypeInStore,
  } = useStartMappingStore(
    useShallow((state) => ({
      showChooseLocationModal: state.showChooseLocationModal,
      setShowChooseLocationModal: state.setShowChooseLocationModal,
      showSigninModal: state.showSigninModal,
      setShowSigninModal: state.setShowSigninModal,
      downloadType: state.downloadType,
      setDownloadType: state.setDownloadType,
      setPredictions: state.setPredictions,
      setPredictionBBox: state.setPredictionBBox,
      setPredictionGridZoom: state.setPredictionGridZoom,
      setOutputType: state.setOutputType,
    })),
  );
  const { closeGuidedTour, openGuidedTour, recordMapRun } =
    useTryFairTour(isSmallViewport);

  const {
    modelId,
    outputType,
    resolution,
    confidence,
    setModelId,
    setOutputType,
    setResolution,
    setConfidence,
    feature,
    setFeature,
    mode,
    setMode,
    imageryUrl,
    imageryTileServiceType,
    oamItemId,
    setImagery,
    isParametersDefault,
    resetParameters,
  } = useTryFairParams();

  const { models: allModels, loading: modelsLoading } = useStacBaseModels();
  const { models: localModels, loading: localModelLoading } =
    useStacLocalModels();

  const models = useMemo(
    () => [...allModels, ...localModels],
    [allModels, localModels],
  );

  const selectedModel = useMemo(
    () => getSelectedModel(models, modelId),
    [models, modelId],
  );
  const {
    imageryBounds,
    imageryCenter,
    setCurrentModelType,
    setSeletedImagery,
    tileLoading,
    tileServiceTypeValidity,
    tileserverURL,
  } = useTryFairImagery({
    map,
    selectedModel,
    mode,
    imageryUrl,
    imageryTileServiceType,
    oamItemId,
  });

  const {
    modelForMapping,
    mappingModelId,
    modelUri,
    hasNoModelsForFeature,
    inferenceParams,
    paramValues,
  } = useImageryMappingModel({
    feature,
    confidence,
    selectedModel,
  });

  const [latestBBox, setLatestBBox] = useState<BBOX | null>(null);

  const [latestGridZoom, setLatestGridZoom] = useState<number | null>(null);
  // Snapshot of the current prediction inputs vs what was last submitted,
  const lastPredictedInputsRef = useRef<string | null>(null);

  const predictionInputsSnapshot = useMemo(() => {
    if (!latestBBox || !mappingModelId) return null;
    return JSON.stringify({
      mappingModelId,
      bbox: latestBBox,
      gridZoom: latestGridZoom,
      resolution,
      paramValues,
    });
  }, [mappingModelId, latestBBox, latestGridZoom, resolution, paramValues]);

  const isDirty =
    predictionInputsSnapshot === null ||
    predictionInputsSnapshot !== lastPredictedInputsRef.current;

  const {
    openDialog: openModelPickerDialog,
    isOpened: isModelPickerDialogOpened,
    closeDialog: closeModelPickerDialog,
  } = useDialog();

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

  // Map Large Area (Export → Map Large Area). Opens when downloadType is set to
  const [isLargeAreaSuccessDialogOpen, setIsLargeAreaSuccessDialogOpen] =
    useState(false);
  const handleLargeAreaSubmit = () => {
    setDownloadType("");
    setIsLargeAreaSuccessDialogOpen(true);
  };
  useEffect(() => {
    if (
      modelForMapping &&
      getModelOutputType(modelForMapping) === TryFairMapOutputType.POINTS &&
      outputType === TryFairMapOutputType.POLYGON
    ) {
      setOutputType(TryFairMapOutputType.POINTS);
    }
  }, [modelForMapping, outputType, setOutputType]);

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
    setMode(ModelType.DEMO);
    setImagery({ url: null, tileServiceType: null, oamItemId: null });
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

  const handleMap = useCallback(() => {
    if (
      hasNoModelsForFeature ||
      !modelForMapping ||
      !mappingModelId ||
      !modelUri ||
      !latestBBox
    )
      return;

    closeGuidedTour();
    // Always centerlize the grid whenever the user clicks on Map
    // This is to prevent situations whereby the user drags the grid to another place and the prediction is not visible to them.
    handleZoomToGrid();
    // Save what we just submitted so we can detect duplicate runs
    lastPredictedInputsRef.current = predictionInputsSnapshot;
    recordMapRun();
    const apiParams = Object.fromEntries(
      Object.entries(paramValues).map(([parameterName, parameterValue]) =>
        parameterName === "confidence_threshold"
          ? [parameterName, parseFloat(Number(parameterValue).toFixed(2))]
          : [parameterName, parameterValue],
      ),
    );

    predict({
      model: modelForMapping,
      modelUri,
      imageUri: tileserverURL,
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
    modelForMapping,
    mappingModelId,
    modelUri,
    latestBBox,
    paramValues,
    predict,
    tileserverURL,
    latestGridZoom,
    resolution,
    predictionInputsSnapshot,
    closeGuidedTour,
    recordMapRun,
    hasNoModelsForFeature,
  ]);
  useEffect(() => {
    if (error) {
      showErrorToast(error);
    }
  }, [error]);
  const isMapButtonDisabled =
    hasNoModelsForFeature ||
    !isDirty ||
    !latestBBox ||
    !modelForMapping ||
    !mappingModelId ||
    !modelUri;

  const handleOutputTypeChange = (type: TryFairMapOutputType) => {
    setOutputType(type);
    setOutputTypeInStore(type);
    if (isDirty && predictions) {
      handleMap();
    }
  };
  const handleApplyImagery = useCallback(
    (selection: ImagerySelection) => {
      setCurrentModelType(ModelType.IMAGERY);
      setSeletedImagery(selection);
      setMode(ModelType.IMAGERY);
      setImagery({
        url:
          selection.source === ImagerySource.CUSTOM ? selection.tileUrl : null,
        tileServiceType:
          selection.source === ImagerySource.CUSTOM
            ? selection.tileServiceType
            : null,
        oamItemId:
          selection.source === ImagerySource.OPEN_AERIAL_MAP
            ? selection.item.id
            : null,
      });
      // Invalidate the last prediction so the Map button re-enables and stale
      // predictions clear when the imagery changes.
      lastPredictedInputsRef.current = null;
      clearPredictions();
      setShowChooseLocationModal(false);
    },
    [
      clearPredictions,
      setCurrentModelType,
      setImagery,
      setMode,
      setSeletedImagery,
      setShowChooseLocationModal,
    ],
  );
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
          selectedModel={modelForMapping}
          onSelect={handleSelectModel}
          models={models}
          onClose={closeModelPickerDialog}
        />
      </Dialog>

      {/* Imagery/location dialog – rendered at page level */}
      <ImageryLocationDialog
        isOpened={showChooseLocationModal}
        closeDialog={() => setShowChooseLocationModal(false)}
        onApply={handleApplyImagery}
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

      <MapLargeAreaRequestSuccess
        isOpen={isLargeAreaSuccessDialogOpen}
        onClose={() => setIsLargeAreaSuccessDialogOpen(false)}
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
            modelId={mappingModelId ?? modelId}
            isPredicting={isPredicting}
            canFitToBounds={true}
            onHelp={openGuidedTour}
          />

          {!isSmallViewport && (
            <div className="absolute top-4 left-4 z-10">
              <TryFairSidebar
                selectedModel={modelForMapping}
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
                feature={feature}
                onFeatureChange={setFeature}
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
                  selectedModel={modelForMapping}
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
                  feature={feature}
                  onFeatureChange={setFeature}
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
