import { MapComponent } from "@/components/map";
import { useMapStore } from "@/store/map-store";
// import { Feature } from "@/types";
import { MIN_ZOOM_LEVEL_FOR_START_MAPPING_PREDICTION } from "@/config";
import { Map } from "maplibre-gl";
import { RefObject } from "react";
import { TryFairMapOutputType, TryFairResolution } from "@/enums/try-fair";

type TryFairMapProps = {
  map: Map | null;
  mapContainerRef: RefObject<HTMLDivElement | null>;
//   predictions: Feature[];
  outputType: TryFairMapOutputType;
  tileServerURL: string;
};

export const TRY_FAIR_RESOLUTION_ZOOM_LEVELS: Record<TryFairResolution, number> = {
  [TryFairResolution.LOW]: MIN_ZOOM_LEVEL_FOR_START_MAPPING_PREDICTION,
  [TryFairResolution.MID]: MIN_ZOOM_LEVEL_FOR_START_MAPPING_PREDICTION + 1,
  [TryFairResolution.HIGH]: MIN_ZOOM_LEVEL_FOR_START_MAPPING_PREDICTION + 2,
};

export const TryFairMap = ({
  map,
  mapContainerRef,
//   predictions,
//   outputType,
  tileServerURL,
}: TryFairMapProps) => {
  const zoom = useMapStore((state) => state.zoom);
  const minZoom = MIN_ZOOM_LEVEL_FOR_START_MAPPING_PREDICTION;

  return (
    <div className="relative w-full h-full">
      <MapComponent
        map={map}
        mapContainerRef={mapContainerRef}
        hasTileServiceLayer={!!tileServerURL}
        tileServiceURL={tileServerURL}
        zoomControls
        // showCurrentZoom
        // geolocationControl
        basemaps
      />
       
      {/* </MapComponent> */}

      {zoom < minZoom && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-white/90 backdrop-blur-sm text-dark text-sm px-4 py-2 rounded-lg shadow-md pointer-events-none">
          Zoom in to at least zoom {minZoom} to run predictions.
        </div>
      )}
    </div>
  );
};
