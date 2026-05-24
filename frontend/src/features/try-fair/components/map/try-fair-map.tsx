import { MapComponent } from "@/components/map";
import { Map } from "maplibre-gl";
import { RefObject, useCallback, useRef, useState } from "react";
import { TryFairMapOutputType } from "@/enums/try-fair";
import { BBOX } from "@/types";
import { TryFairDraggableGrid } from "@/features/try-fair/components/map/draggable-grid";
import { TryFairPredictionsLayer } from "@/features/try-fair/components/map/try-fair-prediction-results";
import { ChoroplethBucket } from "@/features/try-fair/utils/helpers";
import { TryFairChoroplethLegend } from "@/features/try-fair/components/map/chloropleth-legend";
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
}: TryFairMapProps) => {
  const [choroplethBuckets, setChoroplethBuckets] = useState<
    ChoroplethBucket[] | null
  >(null);
  // Track the grid bbox locally so fit-to-grid always has the latest value
  const gridBBoxRef = useRef<BBOX | null>(null);

  const handleFitToGrid = useCallback(() => {
    const bbox = gridBBoxRef.current;
    if (!map || !bbox) return;
    map.fitBounds([bbox[0], bbox[1], bbox[2], bbox[3]], {
      padding: 40,
      essential: true,
    });
  }, [map]);

  return (
    <div className="relative w-full h-full  overflow-hidden">
      <MapComponent
        map={map}
        mapContainerRef={mapContainerRef}
        hasTileServiceLayer={tileServiceValid}
        tileServiceURL={tileServiceValid ? tileServerURL : undefined}
        zoomControls={false}
        basemaps
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
          onBBoxChange={onBBoxChange}
          center={imageryCenter}
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
            rounded={false}
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
    </div>
  );
};
