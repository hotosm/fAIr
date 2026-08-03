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
import { InfoIcon } from "@/components/ui/icons";
import { ToolTip } from "@/components/ui/tooltip";
import { PREDICTION_LAYER_IDS } from "@/features/try-fair/utils/common";
import { getTileZoomForResolution } from "@/features/try-fair/utils/tile-math";
import { TryFairLayerControl } from "@/features/try-fair/components/map/try-fair-layer-control";
import useScreenSize from "@/hooks/use-screen-size";
import { LocateGridIcon } from "@/components/ui/icons/locate-grid-icon";
import { TryFairDownloadButton } from "@/features/try-fair/components/map/try-fair-download-button";
import { cn } from "@/utils";
import { GlobeSearchIcon } from "@/components/ui/icons/globe-search-icon";
import { useStartMappingStore } from "@/features/try-fair/utils/start-mapping-store";
import { useAuth } from "@/app/providers/auth-provider";
import { useTryFairParams } from "@/features/try-fair/hooks/use-try-fair-params";

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
  /** Opens the guided "how it works" tour. */
  onHelp?: () => void;
};

const mapActionButtonClassName =
  "size-8 p-1.5 bg-white rounded-[4px] border-0 flex items-center justify-center text-dark";

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
  onHelp,
}: TryFairMapProps) => {
  const { isSmallViewport } = useScreenSize();
  const { setChooseLocation } = useTryFairParams();
  const { setShowSigninModal } = useStartMappingStore();
  const { isAuthenticated } = useAuth();
  const [choroplethBuckets, setChoroplethBuckets] = useState<
    ChoroplethBucket[] | null
  >(null);
  const gridBBoxRef = useRef<BBOX | null>(null);
  const fitPendingRef = useRef(false);

  const handleFitToGrid = useCallback(() => {
    if (!canFitToBounds) return;
    const bbox = gridBBoxRef.current;
    if (!map || !bbox) return;
    map.fitBounds([bbox[0], bbox[1], bbox[2], bbox[3]], {
      padding: 40,
      essential: true,
    });
  }, [map, canFitToBounds]);

  const handleBBoxChange = useCallback(
    (bbox: BBOX, tileZoom: number) => {
      gridBBoxRef.current = bbox;
      onBBoxChange(bbox, tileZoom);
      // If a resolution change triggered a grid recalculation, fit now.
      if (fitPendingRef.current) {
        fitPendingRef.current = false;
        if (map && canFitToBounds) {
          map.fitBounds([bbox[0], bbox[1], bbox[2], bbox[3]], {
            padding: 40,
            essential: true,
          });
        }
      }
    },
    [onBBoxChange, map, canFitToBounds],
  );

  // When resolution changes, flag that we want to fit once the grid recalculates.
  const prevResolutionRef = useRef(resolution);
  useEffect(() => {
    if (resolution !== prevResolutionRef.current) {
      prevResolutionRef.current = resolution;
      fitPendingRef.current = true;
    }
  }, [resolution]);

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

  const hasPredictions = Boolean(predictions?.features?.length);

  const legend =
    outputType === TryFairMapOutputType.CLUSTER ? (
      <TryFairChoroplethLegend buckets={choroplethBuckets} />
    ) : outputType === TryFairMapOutputType.POINTS ? (
      <TryFairPointsLegend totalCount={predictions?.features.length ?? 0} />
    ) : null;

  return (
    <div className="relative w-full h-full overflow-hidden">
      <MapComponent
        map={map}
        mapContainerRef={mapContainerRef}
        hasTileServiceLayer={tileServiceValid}
        tileServiceURL={tileServiceValid ? tileServerURL : undefined}
        showTileBoundaries
        tileBoundaryZoom={getTileZoomForResolution(resolution)}
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
          outputType={outputType}
          predictionBBox={predictionBBox}
          predictionGridZoom={predictionGridZoom}
        />
      )}

      {map && (
        <div className="absolute top-5 right-3 map-elements-z-index flex flex-col gap-y-4">
          <ToolTip content="Change Imagery">
            <button
              type="button"
              onClick={() => {
                setChooseLocation(true);
                if (!isAuthenticated) {
                  setShowSigninModal(true);
                }
              }}
              disabled={isPredicting}
              aria-label="Choose a different location"
              className={cn(
                mapActionButtonClassName,
                isPredicting && "!disabled:cursor-wait",
              )}
            >
              <GlobeSearchIcon />
            </button>
          </ToolTip>

          {/* Group 1: Zoom In, Zoom Out, Fit to bounds */}
          <div className="flex bg-white rounded-[4px] border border-gray-border md:border-0 shadow-sm flex-col gap-y-0">
            <ZoomControls
              map={map}
              rounded={false}
              className="gap-y-0"
              buttonClassName="size-8 p-1.5 bg-white border-0 flex items-center justify-center text-dark rounded-none"
              zoomInClassName="border-b border-[#E4E4E4] border-t-0 border-x-0 rounded-t-[4px]"
              zoomOutClassName="border-b border-[#E4E4E4] border-t-0 border-x-0 rounded-none"
              iconClassName="size-4 p-0 text-base leading-none"
            />
            <FitToBounds
              map={map}
              BoundsIcon={<LocateGridIcon className="size-5" />}
              bounds={null}
              onClick={handleFitToGrid}
              tooltipContent="Zoom to grid bounds"
              rounded={false}
              buttonClassName={cn(
                "size-8 p-1.5 bg-white border-0 flex items-center justify-center text-dark rounded-b-[4px] rounded-t-none",
                !canFitToBounds && "cursor-not-allowed text-light-gray",
              )}
            />
          </div>

          {/* Group 2: Layer control, Download predictions */}
          <div className="flex bg-white rounded-[4px] border border-gray-border md:border-0 shadow-sm flex-col gap-y-0">
            <TryFairLayerControl
              map={map}
              hasActivePrediction={hasPredictions}
              hasTileServiceLayer={tileServiceValid}
              predictionLayerIds={PREDICTION_LAYER_IDS}
              className="border-b border-[#E4E4E4] border-t-0 border-x-0 rounded-t-[4px] rounded-b-none"
            />

            <TryFairDownloadButton
              predictions={predictions}
              outputType={outputType}
              predictionBBox={predictionBBox}
              predictionGridZoom={predictionGridZoom}
              className="border-0 rounded-b-[4px] rounded-t-none"
            />
          </div>

          {onHelp && (
            <ToolTip content="How it works">
              <button
                type="button"
                onClick={onHelp}
                aria-label="Show the guided tour"
                className={mapActionButtonClassName}
              >
                <InfoIcon className="size-5" />
              </button>
            </ToolTip>
          )}
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
