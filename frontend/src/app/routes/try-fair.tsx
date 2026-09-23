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
import { AdvancedModelPickerContent } from "@/features/try-fair/components/model-picker/advanced-model-picker-dialog";
import { ImageryLocationDialog } from "@/features/try-fair/components/imagery/imagery-location-modal";
import { useStartMappingStore } from "@/features/try-fair/utils/start-mapping-store";
import { SignInPromptDialog } from "@/features/try-fair/components/modals/sign-in-prompt";
import type { ImagerySelection } from "@/features/try-fair/types/imagery-types";
import { MapLargeAreaRequestSuccess } from "@/features/try-fair/components/start-mapping/map-large-area-request-success-dialog";
import { useShallow } from "zustand/react/shallow";
import { showErrorToast } from "@/utils";
import { reverseGeocodeCountry } from "@/features/try-fair/api/hot-imagery";
import { useRecentImageries } from "@/features/try-fair/hooks/use-recent-imageries";
import type { RecentImageryEntry } from "@/features/try-fair/hooks/use-recent-imageries";

export const TryFairPage = () => {
  const { map, mapContainerRef } = useMapInstance(false, false);
  const { isSmallViewport } = useScreenSize();

  const {
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
    selectedModelId,
    outputType,
    resolution,
    confidence,
    setModelId,
    setSelectedModelId,
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
    setImageryMode,
    chooseLocation,
    setChooseLocation,
    isParametersDefault: hasDefaultParameters,
    resetParameters,
  } = useTryFairParams();

  const isChooseLocationOpen = Boolean(chooseLocation);

  const { recentImageries, addRecentImagery } = useRecentImageries();

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
    predictionImageUri,
    setCurrentModelType,
    setSeletedImagery,
    tileLoading,
    tileServiceTypeValidity,
    tileserverURL,
  } = useTryFairImagery({
    selectedModel,
    mode,
    imageryUrl,
    imageryTileServiceType,
    oamItemId,
  });

  const {
    modelForMapping,
    mappingModelId,
    imageryModelId,
    modelUri,
    hasNoModelsForFeature,
    inferenceParams,
    paramValues: defaultParamValues,
  } = useImageryMappingModel({
    feature,
    confidence,
    selectedModel,
    selectedModelId,
  });

  useEffect(() => {
    if (modelForMapping?.id && modelForMapping.id !== modelId) {
      setModelId(modelForMapping.id);
    }
  }, [modelForMapping?.id, modelId, setModelId]);

  useEffect(() => {
    if (imageryModelId && imageryModelId !== selectedModelId) {
      setSelectedModelId(imageryModelId);
    }
  }, [imageryModelId, selectedModelId, setSelectedModelId]);

  const [latestBBox, setLatestBBox] = useState<BBOX | null>(null);

  const [latestGridZoom, setLatestGridZoom] = useState<number | null>(null);
  const [parameterOverrides, setParameterOverrides] = useState<
    Record<string, number | string | boolean>
  >({});
  const paramValues = useMemo(
    () => ({ ...defaultParamValues, ...parameterOverrides }),
    [defaultParamValues, parameterOverrides],
  );
  const isParametersDefault =
    hasDefaultParameters && Object.keys(parameterOverrides).length === 0;

  useEffect(() => {
    setParameterOverrides({});
  }, [mappingModelId]);
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
  const [stagedImagery, setStagedImagery] = useState<ImagerySelection | null>(
    null,
  );
  const [
    isChoosingImageryFromModelPicker,
    setIsChoosingImageryFromModelPicker,
  ] = useState(false);

  const {
    openDialog: openAdvancedModelPickerDialog,
    isOpened: isAdvancedModelPickerDialogOpened,
    closeDialog: closeAdvancedModelPickerDialog,
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
    cancelPrediction,
  } = useFairPredict();

  const handleCancelPrediction = useCallback(() => {
    cancelPrediction();
    lastPredictedInputsRef.current = null;
  }, [cancelPrediction]);

  const handleSelectModel = (model: BaseModelStacItem) => {
    setModelId(model.id);

    // Only reset imagery & mode when the user was on a sample/demo location.
    // If they have their own imagery selected (advanced picker usage), keep it.
    if (mode !== ModelType.IMAGERY) {
      setCurrentModelType(ModelType.DEMO);
      setMode(ModelType.DEMO);
      setImagery({ url: null, tileServiceType: null, oamItemId: null });
      setResolution(TryFairResolution.LOW);
    }

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

  /**
   * Called when the user picks a model from the Samples tab.
   * Always switches to DEMO mode and clears any active imagery,
   * regardless of the current mode.
   */
  const handleSelectSampleModel = (model: BaseModelStacItem) => {
    setStagedImagery(null);
    setSeletedImagery(null);
    setCurrentModelType(ModelType.DEMO);
    setMode(ModelType.DEMO);
    setImagery({ url: null, tileServiceType: null, oamItemId: null });
    handleSelectModel(model);
  };

  const handleResolutionChange = (res: TryFairResolution) => {
    setResolution(res);
  };

  const handleParamChange = useCallback(
    (key: string, value: number | string | boolean) => {
      if (key === "confidence_threshold") {
        setConfidence(value as number);
        return;
      }
      setParameterOverrides((current) => ({ ...current, [key]: value }));
    },
    [setConfidence],
  );

  const handleResetAllParameters = useCallback(() => {
    resetParameters();
    setParameterOverrides({});
  }, [resetParameters]);

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
    predict(
      {
        model: modelForMapping,
        modelUri,
        imageUri: predictionImageUri,
        bbox: latestBBox,
        gridZoom: latestGridZoom ?? undefined,
        resolution,
        params: apiParams,
      },
      {
        onError: (error) => {
          if ((error as { code?: string }).code === "ERR_CANCELED") return;
          showErrorToast(error ?? "An Error Occured.");
          lastPredictedInputsRef.current = null;
        },
      },
    );
  }, [
    modelForMapping,
    mappingModelId,
    modelUri,
    latestBBox,
    paramValues,
    predict,
    predictionImageUri,
    latestGridZoom,
    resolution,
    predictionInputsSnapshot,
    closeGuidedTour,
    recordMapRun,
    hasNoModelsForFeature,
  ]);

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
      setSeletedImagery(selection);
      setCurrentModelType(ModelType.IMAGERY);
      // Use the atomic setter so mode + imagery URL land in a single nuqs
      // update. Two separate setParams calls (setMode then setImagery) leave
      // an intermediate render where mode=IMAGERY but imageryUrl is still
      // null, which made use-try-fair-imagery fall back to the sample imagery.
      setImageryMode({
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
      setChooseLocation(false);

      // Add to recent imageries list.
      const isOam = selection.source === ImagerySource.OPEN_AERIAL_MAP;
      const bounds = selection.bounds ?? null;
      const center = bounds
        ? [(bounds[0] + bounds[2]) / 2, (bounds[1] + bounds[3]) / 2]
        : null;

      const addEntry = (country = "", countryCode = "") => {
        addRecentImagery({
          id: isOam ? selection.item.id : selection.tileUrl,
          title: isOam ? selection.item.title : "Custom Imagery",
          sourceLabel: isOam ? "OpenAerialMap" : "Custom",
          country,
          countryCode,
          tileUrl: selection.tileUrl,
          bounds,
          selection,
          thumbnailUrl: isOam ? (selection.item.thumbnailUrl ?? null) : null,
          addedAt: new Date().toISOString(),
        });
      };
      if (center) {
        reverseGeocodeCountry(center[0], center[1])
          .then((res) => {
            addEntry(res?.country ?? "", res?.countryCode ?? "");
          })
          .catch(() => {
            addEntry("", "");
          });
      } else {
        addEntry("", "");
      }
    },
    [
      addRecentImagery,
      clearPredictions,
      setCurrentModelType,
      setImageryMode,
      setSeletedImagery,
      setChooseLocation,
    ],
  );

  /** Re-apply a previously used imagery from the recent list. */
  const handleApplyRecentImagery = useCallback(
    (entry: RecentImageryEntry) => {
      handleApplyImagery(entry.selection);
    },
    [handleApplyImagery],
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
        label="What do you want to map?"
        isOpened={isModelPickerDialogOpened}
        closeDialog={closeModelPickerDialog}
      >
        <ModelPickerContent
          selectedModel={modelForMapping}
          onSelect={handleSelectSampleModel}
          models={models}
          onClose={closeModelPickerDialog}
          feature={feature}
          onFeatureChange={setFeature}
          stagedImagery={stagedImagery}
          onApplyStagedImagery={(selection) => {
            setStagedImagery(null);
            handleApplyImagery(selection);
          }}
          recentImageries={recentImageries}
          onApplyRecentImagery={(entry) => {
            setStagedImagery(null);
            handleApplyRecentImagery(entry);
          }}
          onChooseImagery={() => {
            closeModelPickerDialog();
            setIsChoosingImageryFromModelPicker(true);
            setChooseLocation(true);
          }}
        />
      </Dialog>

      {/* Advanced Model picker dialog */}
      <Dialog
        label="Select a Model"
        isOpened={isAdvancedModelPickerDialogOpened}
        closeDialog={closeAdvancedModelPickerDialog}
      >
        <AdvancedModelPickerContent
          feature={feature}
          onSelect={handleSelectModel}
          onClose={closeAdvancedModelPickerDialog}
        />
      </Dialog>

      {/* Imagery/location dialog – rendered at page level */}
      <ImageryLocationDialog
        isOpened={isChooseLocationOpen}
        closeDialog={() => {
          setChooseLocation(false);
          setIsChoosingImageryFromModelPicker(false);
        }}
        onBackToModelPicker={
          isChoosingImageryFromModelPicker
            ? () => {
                setChooseLocation(false);
                setIsChoosingImageryFromModelPicker(false);
                openModelPickerDialog();
              }
            : undefined
        }
        onApply={(selection) => {
          if (isChoosingImageryFromModelPicker) {
            setStagedImagery(selection);
            return;
          }
          handleApplyImagery(selection);
        }}
      />
      <SignInPromptDialog
        isOpened={showSigninModal}
        closeDialog={() => setShowSigninModal(false)}
      />

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
            hasNoResults={
              !isPredicting &&
              Boolean(predictions && !predictions.features.length)
            }
            imageryCenter={imageryCenter}
            resolution={resolution}
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
                onResetParameters={handleResetAllParameters}
                isParametersDefault={isParametersDefault}
                onMap={handleMap}
                onCancelPrediction={handleCancelPrediction}
                isPredicting={isPredicting}
                isMapButtonDisabled={isMapButtonDisabled}
                openMobileModelPickerDialog={openModelPickerDialog}
                openAdvancedModelPickerDialog={openAdvancedModelPickerDialog}
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
                  onResetParameters={handleResetAllParameters}
                  isParametersDefault={isParametersDefault}
                  onMap={handleMap}
                  onCancelPrediction={handleCancelPrediction}
                  isPredicting={isPredicting}
                  isMapButtonDisabled={isMapButtonDisabled}
                  className="w-full shadow-none"
                  openMobileModelPickerDialog={openModelPickerDialog}
                  openAdvancedModelPickerDialog={openAdvancedModelPickerDialog}
                />
              </MobileDrawer>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
