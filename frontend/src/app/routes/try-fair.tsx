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
import {
  getInferenceParams,
  InferenceParam,
} from "@/features/try-fair/api/stac";
import { TRY_FAIR_RESOLUTION_ZOOM } from "@/features/try-fair/utils/common";

export const TryFairPage = () => {
  const { map, mapContainerRef } = useMapInstance(false, false);

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
  } = useFairPredict();

  // Handlers
  const handleSelectModel = (model: { id: string }) => {
    setModelId(model.id);
    setResolution(TryFairResolution.MID);
    setIsDirty(true);
  };

  const handleResolutionChange = (res: TryFairResolution) => {
    setResolution(res);
    setIsDirty(true);
    // Zoom the map to the tile zoom that matches this resolution so the grid
    if (map)
      map.easeTo({ zoom: TRY_FAIR_RESOLUTION_ZOOM[res], essential: true });
  };

  const handleOutputTypeChange = (type: TryFairMapOutputType) => {
    setOutputType(type);
    // Output type switch is client side approach - if server side then we will need to re-predict
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

  const handleMap = () => {
    if (!selectedModel || !latestBBox || !demoConfig) return;
    setIsDirty(false);
    // Invert confidence_threshold for the API: a lower threshold value produces better results
    const apiParams = Object.fromEntries(
      Object.entries(paramValues).map(([k, v]) =>
        k === "confidence_threshold"
          ? [k, parseFloat((1 - Number(v)).toFixed(2))]
          : [k, v],
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
          />

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
              isMapButtonDisabled={!isDirty || !latestBBox || !demoConfig}
            />
          </div>
        </div>
      </div>
    </>
  );
};
