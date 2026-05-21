import { MapComponent } from "@/components/map";
import { useMapStore } from "@/store/map-store";
import { MIN_ZOOM_LEVEL_FOR_START_MAPPING_PREDICTION } from "@/config";
import { Map } from "maplibre-gl";
import { RefObject } from "react";
import { TryFairMapOutputType } from "@/enums/try-fair";
import { BBOX } from "@/types";
import { TryFairDraggableGrid } from "./draggable-grid";

type TryFairMapProps = {
  map: Map | null;
  mapContainerRef: RefObject<HTMLDivElement | null>;
  outputType: TryFairMapOutputType;
  tileServerURL: string;
  tileServiceValid: boolean;
  onBBoxChange: (bbox: BBOX) => void;
};

export const TryFairMap = ({
  map,
  mapContainerRef,
  tileServerURL,
  tileServiceValid,
  onBBoxChange,
}: TryFairMapProps) => {
  const zoom = useMapStore((state) => state.zoom);
  const minZoom = MIN_ZOOM_LEVEL_FOR_START_MAPPING_PREDICTION;

  return (
    <div className="relative w-full h-full">
      <MapComponent
        map={map}
        mapContainerRef={mapContainerRef}
        hasTileServiceLayer={tileServiceValid}
        tileServiceURL={tileServiceValid ? tileServerURL : undefined}
        zoomControls
        basemaps
        showCurrentZoom
      />

      {map && (
        <TryFairDraggableGrid
          map={map}
          mapContainerRef={mapContainerRef}
          onBBoxChange={onBBoxChange}
        />
      )}

      {zoom < minZoom && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-white/90 backdrop-blur-sm text-dark text-sm px-4 py-2 rounded-lg shadow-md pointer-events-none">
          Zoom in to at least zoom {minZoom} to run predictions.
        </div>
      )}
    </div>
  );
};
