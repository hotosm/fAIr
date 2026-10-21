import { Head } from "@/components/seo";
import { TRY_FAIR_PAGE_CONTENT } from "@/constants/ui-contents/try-fair-contents";
import {
  ImagerySource,
  ModelType,
  SHOELACE_SIZES,
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
import {
  getModelDefaultResolution,
  getModelOutputType,
} from "@/features/try-fair/utils/common";
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
import { getPredictionClassStyle } from "@/features/try-fair/utils/prediction-classes";
import { useAuth } from "@/app/providers/auth-provider";
import { useParams } from "react-router-dom";
import { MappingProjectAutosave } from "@/features/try-fair/components/mapping-project-autosave";
import { PREDICTION_HISTORY_LIMIT } from "@/config";
import {
  appendPrediction,
  getHistoryUrlParams,
  getSavedPrediction,
  restorePredictionHistory,
} from "@/features/try-fair/utils/prediction-history";
import { PredictionHistoryPanel } from "@/features/try-fair/components/prediction-history-panel";
import type {
  MappingSnapshot,
  PredictionHistoryEntry,
  SavedUserState,
} from "@/features/try-fair/api/user-state";

export const TryFairPage = ({
  initialProject,
}: {
  initialProject?: SavedUserState;
}) => {
  const [predictionHistory, setPredictionHistory] = useState(() =>
    restorePredictionHistory(initialProject, PREDICTION_HISTORY_LIMIT),
  );
  const [activePredictionId, setActivePredictionId] = useState<string | null>(
    () =>
      initialProject?.state.active_prediction_id ??
      (initialProject?.state.prediction_result
        ? (predictionHistory[predictionHistory.length - 1]?.id ?? null)
        : null),
  );
  const [restoredSnapshot, setRestoredSnapshot] =
    useState<MappingSnapshot | null>(null);
  const showPredictionHistory = useStartMappingStore(
    (state) => state.showPredictionHistory,
  );
  const setShowPredictionHistory = useStartMappingStore(
    (state) => state.setShowPredictionHistory,
  );
  useEffect(
    () => () => setShowPredictionHistory(false),
    [setShowPredictionHistory],
  );

  const { map, mapContainerRef } = useMapInstance(
    false,
    false,
    "default",
    undefined,
    initialProject?.state.bbox,
  );
  const { isSmallViewport } = useScreenSize();
  const { isAuthenticated, user } = useAuth();
  const { pid: projectId } = useParams();
  const [hasSuccessfulPrediction, setHasSuccessfulPrediction] = useState(
    initialProject?.state.type === "mapping",
  );

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
    urlState,
    restoreParams,
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
    parameterOverrides,
    setParameterOverride,
    resetParameterOverrides,
    feature,
    setFeature,
    mode,
    setMode,
    mappingMode,
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

  const { recentImageries, addRecentImagery, clearRecentImageries } =
    useRecentImageries();

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
    selectedImagery,
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
    modelsReady,
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
  const predictionClassStyle = useMemo(
    () => getPredictionClassStyle(modelForMapping),
    [modelForMapping],
  );

  const modelPreview = modelForMapping?.properties["fair:preview"];
  const preImageryUrl =
    mode === ModelType.DEMO ? (modelPreview?.pre_imagery?.url ?? null) : null;

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

  const [latestBBox, setLatestBBox] = useState<BBOX | null>(
    initialProject?.state.bbox ?? null,
  );

  const [latestGridZoom, setLatestGridZoom] = useState<number | null>(
    initialProject?.state.zoom ?? null,
  );
  const paramValues = useMemo(
    () => ({ ...defaultParamValues, ...parameterOverrides }),
    [defaultParamValues, parameterOverrides],
  );
  const isParametersDefault =
    hasDefaultParameters && Object.keys(parameterOverrides).length === 0;

  const previousMappingModel = useRef(initialProject?.state.model.id);
  useEffect(() => {
    if (!mappingModelId) return;
    if (
      previousMappingModel.current &&
      previousMappingModel.current !== mappingModelId
    ) {
      resetParameterOverrides();
    }
    previousMappingModel.current = mappingModelId;
  }, [mappingModelId, resetParameterOverrides]);

  // Keep the saved AOI centered while imagery metadata loads. A new imagery
  // selection releases this override and uses that imagery's normal center.
  const restoredCenter = useMemo<[number, number] | undefined>(() => {
    const saved = restoredSnapshot ?? initialProject?.state;
    if (!saved?.bbox) return undefined;
    const original = saved.url_params;
    const sameImagery = original
      ? mode === original.mode &&
        (mode !== ModelType.DEMO || modelId === original.model) &&
        imageryUrl === original.imagery &&
        oamItemId === original.oamItem
      : mode === ModelType.IMAGERY && imageryUrl === saved.imagery.url;
    if (!sameImagery) return undefined;
    const [w, s, e, n] = saved.bbox;
    return [(w + e) / 2, (s + n) / 2];
  }, [initialProject, restoredSnapshot, mode, modelId, imageryUrl, oamItemId]);
  // Snapshot of the current prediction inputs vs what was last submitted,
  const restoredPrediction = getSavedPrediction(initialProject);
  const lastPredictedInputsRef = useRef<string | null>(
    restoredPrediction
      ? JSON.stringify({
          mappingModelId: restoredPrediction.modelId,
          bbox: restoredPrediction.bbox,
          gridZoom: restoredPrediction.gridZoom,
          resolution: restoredPrediction.resolution,
          paramValues: restoredPrediction.params,
        })
      : null,
  );

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
    restoreResult,
    cancelPrediction,
  } = useFairPredict(restoredPrediction);

  const handleCancelPrediction = useCallback(() => {
    cancelPrediction();
    lastPredictedInputsRef.current = null;
  }, [cancelPrediction]);

  const handleSelectModel = (model: BaseModelStacItem) => {
    setModelId(model.id);
    setResolution(getModelDefaultResolution(model));

    // Only reset imagery & mode when the user was on a sample/demo location.
    // If they have their own imagery selected (advanced picker usage), keep it.
    if (mode !== ModelType.IMAGERY) {
      setCurrentModelType(ModelType.DEMO);
      setMode(ModelType.DEMO);
      setImagery({ url: null, tileServiceType: null, oamItemId: null });
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
    setActivePredictionId(null);
    setRestoredSnapshot(null);
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
      setParameterOverride(key, value);
    },
    [setConfidence, setParameterOverride],
  );

  const handleResetAllParameters = useCallback(() => {
    resetParameters();
    resetParameterOverrides();
  }, [resetParameterOverrides, resetParameters]);

  const handleBBoxChange = useCallback((bbox: BBOX, tileZoom: number) => {
    setLatestBBox(bbox);
    setLatestGridZoom(tileZoom);
  }, []);
  let imageryName = "Custom Imagery";
  let locationName: string | undefined;
  if (mode === ModelType.DEMO) {
    imageryName = modelPreview?.imagery.name ?? "Demo Imagery";
    locationName = modelPreview?.imagery.name ?? modelPreview?.place?.name;
  } else if (selectedImagery?.source === ImagerySource.OPEN_AERIAL_MAP) {
    imageryName = selectedImagery.item.title;
    locationName = imageryName;
  }

  const currentSnapshot: MappingSnapshot | null = modelForMapping
    ? {
        type: "mapping",
        category:
          mode === ModelType.IMAGERY
            ? feature
            : modelForMapping.properties["fair:category"],
        name: locationName ?? modelForMapping.properties.title,
        model: {
          id: modelForMapping.id,
          title: modelForMapping.properties.title,
        },
        imagery: {
          name: imageryName,
          url: tileserverURL,
        },
        zoom: latestGridZoom,
        bbox: latestBBox,
        url_params: urlState,
        params: paramValues,
      }
    : null;

  const handleMap = useCallback(() => {
    if (
      hasNoModelsForFeature ||
      !modelForMapping ||
      !currentSnapshot ||
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
        onSuccess: (result) => {
          const entry: PredictionHistoryEntry = {
            id: crypto.randomUUID(),
            created_at: new Date().toISOString(),
            snapshot: {
              ...currentSnapshot,
              bbox: result.bbox,
              zoom: result.gridZoom,
              params: result.params,
              url_params: getHistoryUrlParams(
                currentSnapshot.url_params,
                result.params,
              ),
              prediction_result: result,
            },
          };
          setPredictionHistory((history) =>
            appendPrediction(history, entry, PREDICTION_HISTORY_LIMIT),
          );
          setActivePredictionId(entry.id);
          setHasSuccessfulPrediction(true);
        },
        onError: (error) => {
          if ((error as { code?: string }).code === "ERR_CANCELED") return;
          showErrorToast(error ?? "An Error Occured.");
          lastPredictedInputsRef.current = null;
        },
      },
    );
  }, [
    currentSnapshot,
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
      setActivePredictionId(null);
      setRestoredSnapshot(null);
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

  const handleRestorePrediction = (entry: PredictionHistoryEntry) => {
    if (isPredicting) return;
    const snapshot = entry.snapshot;
    const result = snapshot.prediction_result;
    previousMappingModel.current = result.modelId;
    setStagedImagery(null);
    if (
      snapshot.url_params.mode !== mode ||
      snapshot.url_params.imagery !== imageryUrl ||
      snapshot.url_params.oamItem !== oamItemId ||
      snapshot.url_params.imageryType !== imageryTileServiceType
    ) {
      setSeletedImagery(null);
    }
    setCurrentModelType(snapshot.url_params.mode);
    restoreParams(getHistoryUrlParams(snapshot.url_params, result.params));
    setRestoredSnapshot(snapshot);
    map?.fitBounds(result.bbox, { padding: 40, duration: 0 });
    setLatestBBox(result.bbox);
    setLatestGridZoom(result.gridZoom);
    restoreResult(result);
    setActivePredictionId(entry.id);
    lastPredictedInputsRef.current = JSON.stringify({
      mappingModelId: result.modelId,
      bbox: result.bbox,
      gridZoom: result.gridZoom,
      resolution: result.resolution,
      paramValues: result.params,
    });
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
      {isAuthenticated && (
        <MappingProjectAutosave
          key={`${user.osm_id}:${projectId ?? "new"}`}
          enabled={
            hasSuccessfulPrediction &&
            modelsReady &&
            (mode === ModelType.DEMO ||
              (Boolean(selectedImagery) && tileServiceTypeValidity.valid)) &&
            !isPredicting &&
            !tileLoading
          }
          initialPid={projectId ? Number(projectId) : undefined}
          skipInitialSave={Boolean(initialProject)}
          payload={
            currentSnapshot
              ? {
                  state: {
                    ...currentSnapshot,
                    prediction_result: undefined,
                    prediction_history: predictionHistory,
                    active_prediction_id: activePredictionId,
                  },
                }
              : null
          }
        />
      )}

      {/* Model picker dialog – rendered at page level so it's not trapped inside MobileDrawer */}
      <Dialog
        borderRadius="rounded"
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
          onClearRecentImageries={clearRecentImageries}
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
        size={SHOELACE_SIZES.LARGE}
        borderRadius="rounded"
        label="Which model do you want to use?"
        isOpened={isAdvancedModelPickerDialogOpened}
        preventClose
        closeDialog={closeAdvancedModelPickerDialog}
      >
        <AdvancedModelPickerContent
          feature={feature}
          onSelect={handleSelectModel}
          onFeatureChange={setFeature}
        />
      </Dialog>

      {/* Imagery/location dialog – rendered at page level */}
      <ImageryLocationDialog
        isOpened={isChooseLocationOpen}
        isCustomImageryEnabled={mappingMode === "advanced"}
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
          <PredictionHistoryPanel
            open={showPredictionHistory}
            entries={predictionHistory}
            activeId={activePredictionId}
            disabled={isPredicting}
            onSelect={handleRestorePrediction}
            onClose={() => setShowPredictionHistory(false)}
          />
          <div className="absolute inset-0">
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
              imageryCenter={restoredCenter ?? imageryCenter}
              resolution={resolution}
              isPredicting={isPredicting}
              preImageryUrl={preImageryUrl}
              predictionClassStyle={predictionClassStyle}
              canFitToBounds={true}
              onHelp={openGuidedTour}
            />
          </div>

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
