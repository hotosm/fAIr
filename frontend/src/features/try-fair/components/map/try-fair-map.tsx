import { MapComponent } from "@/components/map";
import { Map } from "maplibre-gl";
import { RefObject, useCallback, useEffect, useRef, useState } from "react";
import { TryFairMapOutputType, TryFairResolution } from "@/enums/try-fair";
import { BBOX } from "@/types";
import { TryFairDraggableGrid } from "@/features/try-fair/components/map/draggable-grid";
import { TryFairPredictionsLayer } from "@/features/try-fair/components/map/try-fair-prediction-results";
import { ChoroplethBucket } from "@/features/try-fair/utils/helpers";
import { TryFairChoroplethLegend } from "@/features/try-fair/components/map/chloropleth-legend";
import { TryFairPointsLegend } from "@/features/try-fair/components/map/points-legend";
import {
  LayerControl,
  FitToBounds,
  ZoomControls,
} from "@/components/map/controls";
import { PREDICTION_LAYER_IDS } from "@/features/try-fair/utils/common";

type TryFairMapProps = {
  map: Map | null;
  mapContainerRef: RefObject<HTMLDivElement | null>;
  outputType: TryFairMapOutputType;
  tileServerURL: string;
  tileLoading: boolean;
  tileServiceValid: boolean;
  onBBoxChange: (bbox: BBOX, tileZoom: number) => void;
  predictions: GeoJSON.FeatureCollection | null;
  predictionBBox: BBOX | null;
  predictionGridZoom?: number | null;
  imageryCenter?: [number, number];
  resolution?: TryFairResolution;
  modelId?: string | null;
  isPredicting?: boolean;
  onGridZoom?: () => void;
};

export const TryFairMap = ({
  map,
  mapContainerRef,
  outputType,
  tileServerURL,
  tileServiceValid,
  onBBoxChange,
  predictions,
  predictionBBox,
  predictionGridZoom,
  imageryCenter,
  resolution,
  modelId,
  isPredicting = false,
  onGridZoom,
}: TryFairMapProps) => {
  const [choroplethBuckets, setChoroplethBuckets] = useState<
    ChoroplethBucket[] | null
  >(null);
  // Track the grid bbox locally so fit-to-grid always has the latest value
  const gridBBoxRef = useRef<BBOX | null>(null);

  // Intercept bbox changes so gridBBoxRef always has the latest value
  const handleBBoxChange = useCallback(
    (bbox: BBOX, tileZoom: number) => {
      gridBBoxRef.current = bbox;
      onBBoxChange(bbox, tileZoom);
    },
    [onBBoxChange],
  );

  const handleFitToGrid = useCallback(() => {
    const bbox = gridBBoxRef.current;
    if (!map || !bbox) return;
    map.fitBounds([bbox[0], bbox[1], bbox[2], bbox[3]], {
      padding: 40,
      essential: true,
    });
    onGridZoom?.();
  }, [map, onGridZoom]);

  // Disable all map interactions while a prediction is running so the grid
  // stays anchored over the area that was submitted.
  useEffect(() => {
    if (!map) return;
    const handlers = [
      map.scrollZoom,
      map.boxZoom,
      map.dragRotate,
      map.dragPan,
      map.keyboard,
      map.doubleClickZoom,
      map.touchZoomRotate,
      map.touchPitch,
    ];
    if (isPredicting) {
      handlers.forEach((h) => h?.disable());
    } else {
      handlers.forEach((h) => h?.enable());
    }
    return () => {
      // Always re-enable on unmount/cleanup to avoid getting stuck
      handlers.forEach((h) => h?.enable());
    };
  }, [map, isPredicting]);

  return (
    <div className="relative w-full h-full  overflow-hidden">
      <MapComponent
        map={map}
        mapContainerRef={mapContainerRef}
        hasTileServiceLayer={tileServiceValid}
        tileServiceURL={tileServiceValid ? tileServerURL : undefined}
        zoomControls={false}
        basemaps
        onTileServiceFitToBounds={handleFitToGrid}
      />

      <TryFairPredictionsLayer
        map={map}
        predictions={predictions}
        predictionBBox={predictionBBox}
        predictionGridZoom={predictionGridZoom ?? undefined}
        outputType={outputType}
        onChoroplethBucketsChange={setChoroplethBuckets}
      />

      {map && (
        <TryFairDraggableGrid
          map={map}
          mapContainerRef={mapContainerRef}
          onBBoxChange={handleBBoxChange}
          center={imageryCenter}
          resolution={resolution}
          modelId={modelId}
          isPredicting={isPredicting}
          predictions={predictions}
          outputType={outputType}
        />
      )}

      {/* ── Right-side control strip ──────────────────────────────────── */}
      {map && (
        <div className="absolute top-5 right-3 map-elements-z-index flex flex-col gap-y-[1px]">
          {/* Zoom in / out */}
          <ZoomControls map={map} />

          {/* Divider */}
          <div className="h-2" />

          {/* Zoom to grid */}
          <FitToBounds
            map={map}
            bounds={null}
            onClick={handleFitToGrid}
            tooltipContent="Zoom to grid bounds"
          />

          {/* Layers panel */}
          <LayerControl
            map={map}
            basemaps
            hasTileServiceLayer={tileServiceValid}
            layers={[
              {
                value: "Predictions",
                subLayers: PREDICTION_LAYER_IDS,
              },
            ]}
          />
        </div>
      )}

      {outputType === TryFairMapOutputType.CLUSTER && (
        <TryFairChoroplethLegend buckets={choroplethBuckets} />
      )}

      {outputType === TryFairMapOutputType.POINTS && (
        <TryFairPointsLegend totalCount={predictions?.features.length ?? 0} />
      )}
    </div>
  );
};
