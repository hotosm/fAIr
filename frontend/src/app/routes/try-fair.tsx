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
import { TryFairBanner } from "@/features/try-fair/components/try-fair-banner";
import { useTryFairStore } from "@/store/try-fair-store";
import {
  getInferenceParams,
  InferenceParam,
} from "@/features/try-fair/api/stac";
import useScreenSize from "@/hooks/use-screen-size";
import { MobileDrawer } from "@/components/ui/drawer";
export const TryFairPage = () => {
  const { map, mapContainerRef } = useMapInstance(false, false);
  const { isSmallViewport } = useScreenSize();

  // URL-persisted state (nuqs)
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

  // ── Models from STAC
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

  // ── Inference params (derived from selected model's STAC spec) ────────────
  const inferenceParams: InferenceParam[] = useMemo(
    () => (selectedModel ? getInferenceParams(selectedModel) : []),
    [selectedModel],
  );

  // Merge STAC defaults with URL-persisted confidence
  const paramValues = useMemo(() => {
    const values: Record<string, number | string | boolean> = {};
    inferenceParams.forEach(({ key, spec }) => {
      values[key] = key === "confidence_threshold" ? confidence : spec.default;
    });
    return values;
  }, [inferenceParams, confidence]);

  // Other UI state (not in URL)
  const [latestBBox, setLatestBBox] = useState<BBOX | null>(null);
  const [latestGridZoom, setLatestGridZoom] = useState<number | null>(null);
  const [isDirty, setIsDirty] = useState(true);

  // Event tracking
  const [gridZoomed, setGridZoomed] = useState(false);
  const [mapClickCount, setMapClickCount] = useState(0);
  const [bannerVisible, setBannerVisible] = useState(false);
  const [highlightSidebar, setHighlightSidebar] = useState(false);
  const autoTriggeredRef = useRef(false);
  const setHighlightStartMapping = useTryFairStore(
    (s) => s.setHighlightStartMapping,
  );

  // Tile service
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

  // Derive the best centre to fly/recenter to:
  // 1. tileJSON `center` field  2. bounds midpoint  3. demoConfig fallback
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

  // Fly to imagery centre on model load. Resolution controls prediction zoom,
  // while the draggable grid now follows the active map zoom level.
  const INITIAL_MAP_ZOOM = 18;

  useEffect(() => {
    if (!map || !demoConfig || !imageryCenter) return;

    const doFly = () => {
      map.flyTo({
        center: imageryCenter,
        zoom: INITIAL_MAP_ZOOM,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, demoConfig, imageryCenter]);

  // Predict
  const {
    predict,
    isPredicting,
    predictions,
    predictionBBox,
    predictionGridZoom,
    clearPredictions,
  } = useFairPredict();

  // Handlers
  const handleSelectModel = (model: { id: string }) => {
    setModelId(model.id);
    setResolution(TryFairResolution.MID);
    setIsDirty(true);
    clearPredictions();
    setBannerVisible(false);
  };

  const handleResolutionChange = (res: TryFairResolution) => {
    setResolution(res);
    setIsDirty(true);
    // Resolution only changes the grid tile structure — the map camera stays put.
  };

  // handleOutputTypeChange is defined after handleMap (below) so it can call it.

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

  // Auto-trigger the first prediction once the map is ready, imagery has loaded,
  // and the grid has been fit-to-bounds.
  const isMapButtonDisabled = !isDirty || !latestBBox || !demoConfig;
  useEffect(() => {
    if (autoTriggeredRef.current) return;
    if (
      !map ||
      !tileJSONMetadata ||
      !gridZoomed ||
      isMapButtonDisabled ||
      isPredicting
    )
      return;
    autoTriggeredRef.current = true;
    handleMap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, tileJSONMetadata, gridZoomed, isMapButtonDisabled, isPredicting]);

  // Show the banner only on the 1st and 4th successful map runs.
  useEffect(() => {
    if (isPredicting || !predictions) return;

    const shouldShowBanner = mapClickCount === 1 || mapClickCount === 4;
    setBannerVisible(shouldShowBanner);
    if (!shouldShowBanner) return;

    if (mapClickCount === 1) {
      setHighlightSidebar(true);
      const timer = setTimeout(() => setHighlightSidebar(false), 5000);
      return () => clearTimeout(timer);
    }

    if (mapClickCount === 4) {
      setHighlightStartMapping(true);
      const timer = setTimeout(() => setHighlightStartMapping(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [isPredicting, predictions]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleMap = () => {
    if (!selectedModel || !latestBBox || !demoConfig) return;
    setIsDirty(false);
    setMapClickCount((n) => n + 1);
    setBannerVisible(false);
    // Invert confidence_threshold for the API: a lower threshold value produces better results
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
  };

  const handleOutputTypeChange = (type: TryFairMapOutputType) => {
    setOutputType(type);
    // If the grid has been moved since the last prediction, re-run at the new
    // location rather than just switching the rendering of stale results.
    if (isDirty && predictions) {
      handleMap();
    }
  };

  return (
    <>
      <Head title={TRY_FAIR_PAGE_CONTENT.pageTitle} />

      <div className="flex  h-[92vh] flex-col fullscreen">
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

          {bannerVisible && (
            <div className="absolute bottom-4 left-4 z-10">
              <TryFairBanner
                mapClickCount={mapClickCount}
                onDismiss={() => {
                  setBannerVisible(false);
                  setHighlightStartMapping(false);
                }}
              />
            </div>
          )}

          {!isSmallViewport && (
            <div className="absolute top-4 left-4 z-10">
              {highlightSidebar && (
                <div className="absolute inset-0 ring-2 ring-primary ring-offset-2 rounded-xl animate-pulse pointer-events-none z-20" />
              )}
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
              {highlightSidebar && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 h-10 w-28 ring-2 ring-primary ring-offset-2 rounded-full animate-pulse pointer-events-none z-20" />
              )}
              <MobileDrawer
                open={isSmallViewport}
                dialogTitle="Try Fair Settings"
                snapPoints={[0.2, 0.9]}
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
