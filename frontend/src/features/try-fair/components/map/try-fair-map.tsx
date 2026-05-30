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
import { FitToBounds, ZoomControls } from "@/components/map/controls";
import { PREDICTION_LAYER_IDS } from "@/features/try-fair/utils/common";
import { TryFairLayerControl } from "@/features/try-fair/components/map/try-fair-layer-control";
import useScreenSize from "@/hooks/use-screen-size";

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
  canFitToBounds: boolean;
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
  canFitToBounds,
}: TryFairMapProps) => {
  const { isSmallViewport } = useScreenSize();
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
    if (!canFitToBounds) return;
    const bbox = gridBBoxRef.current;
    if (!map || !bbox) return;
    map.fitBounds([bbox[0], bbox[1], bbox[2], bbox[3]], {
      padding: 40,
      essential: true,
    });
  }, [map, canFitToBounds]);

  useEffect(() => {
    if (!map) return;

    if (isPredicting) {
      map.dragPan.disable();
      map.dragRotate.disable();
      map.scrollZoom.disable();
      map.boxZoom.disable();
      map.doubleClickZoom.disable();
      map.keyboard.disable();
      map.touchZoomRotate.disable();
      map.touchPitch.disable();
    } else {
      map.dragPan.enable();
      map.dragRotate.enable();
      map.scrollZoom.enable();
      map.boxZoom.enable();
      map.doubleClickZoom.enable();
      map.keyboard.enable();
      map.touchZoomRotate.enable();
      map.touchPitch.enable();
    }
  }, [map, isPredicting]);
  // useEffect(() => {
  //   if (!map) return;
  //   const handlers = [map.dragRotate, map.dragPan, map.touchPitch, map.touchZoomRotate];
  //   if (isPredicting) {
  //     handlers.forEach((handler) => handler?.disable());
  //   } else {
  //     handlers.forEach((handler) => handler?.enable());
  //   }
  //   return () => {
  //     // Always re-enable on unmount/cleanup to avoid getting stuck
  //     handlers.forEach((handler) => handler?.enable());
  //   };
  // }, [map, isPredicting]);

  const legend =
    outputType === TryFairMapOutputType.CLUSTER ? (
      <TryFairChoroplethLegend buckets={choroplethBuckets} />
    ) : outputType === TryFairMapOutputType.POINTS ? (
      <TryFairPointsLegend totalCount={predictions?.features.length ?? 0} />
    ) : null;

  return (
    <div className="relative w-full h-full  overflow-hidden">
      <MapComponent
        map={map}
        mapContainerRef={mapContainerRef}
        hasTileServiceLayer={tileServiceValid}
        tileServiceURL={tileServiceValid ? tileServerURL : undefined}
        showTileBoundaries
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
          predictionBBox={predictionBBox}
          predictionGridZoom={predictionGridZoom}
        />
      )}

      {map && (
        <div className="absolute top-5 right-3 map-elements-z-index flex flex-col gap-y-[3px]">
          <ZoomControls map={map} rounded={true} />
          <FitToBounds
            map={map}
            bounds={null}
            onClick={handleFitToGrid}
            tooltipContent="Zoom to grid bounds"
          />
          <TryFairLayerControl
            map={map}
            hasActivePrediction={Boolean(predictions?.features?.length)}
            hasTileServiceLayer={tileServiceValid}
            predictionLayerIds={PREDICTION_LAYER_IDS}
          />
        </div>
      )}

      {legend &&
        (isSmallViewport ? (
          <div className="absolute bottom-[25vh] right-4 z-10">{legend}</div>
        ) : (
          legend
        ))}
    </div>
  );
};
