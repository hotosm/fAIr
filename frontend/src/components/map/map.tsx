import { GoogleBasemapLayer } from "@/components/map/layers/google-basemap";
import { ControlsPosition } from "@/enums";
import { DrawingModes } from "@/enums";
import { LngLatBoundsLike, Map } from "maplibre-gl";
import { RefObject } from "react";
import { TerraDraw } from "terra-draw";
import { TileBoundaries } from "@/components/map/layers/tile-boundaries";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  GeolocationControl,
  FitToBounds,
  DrawControl,
  ZoomLevel,
  LayerControl,
  ZoomControls,
} from "@/components/map/controls";
import { TileServiceLayer } from "@/hooks/tile-service-layer";

type MapComponentProps = {
  geolocationControl?: boolean;
  controlsPosition?: ControlsPosition;
  drawControl?: boolean;
  showCurrentZoom?: boolean;
  layerControl?: boolean;
  layerControlLayers?: {
    value: string;
    subLayers: string[];
  }[];
  showTileBoundaries?: boolean;
  children?: React.ReactNode;
  basemaps?: boolean;
  fitToBounds?: boolean;
  bounds?: LngLatBoundsLike;
  onMapLoad?: (map: Map) => void;
  mapContainerRef?: RefObject<HTMLDivElement | null> | null;
  map: Map | null;
  terraDraw?: TerraDraw | undefined;
  drawingMode?: DrawingModes;
  setDrawingMode?: (newMode: DrawingModes) => void;
  zoomControls?: boolean;
  tileServiceURL?: string;
  hasTileServiceLayer?: boolean;
};

export const MapComponent: React.FC<MapComponentProps> = ({
  geolocationControl = false,
  controlsPosition = ControlsPosition.TOP_RIGHT,
  drawControl = false,
  showCurrentZoom = false,
  layerControl = false,
  layerControlLayers = [],
  showTileBoundaries = false,
  basemaps = false,
  children,
  fitToBounds,
  bounds,
  mapContainerRef,
  map,
  terraDraw,
  drawingMode,
  zoomControls = true,
  setDrawingMode,
  tileServiceURL,
  hasTileServiceLayer = false,
}) => {
  return (
    <div className={`h-full relative w-full`} ref={mapContainerRef}>
      {map ? (
        <>
          <div
            className={`absolute top-5 ${
              controlsPosition === ControlsPosition.TOP_RIGHT
                ? "right-3"
                : "left-3"
            } map-elements-z-index flex flex-col gap-y-[1px]`}
          >
            {zoomControls ? <ZoomControls map={map} /> : null}
            {geolocationControl && <GeolocationControl map={map} />}
            {drawControl && terraDraw && drawingMode && setDrawingMode && (
              <DrawControl
                terraDraw={terraDraw}
                drawingMode={drawingMode}
                setDrawingMode={setDrawingMode}
              />
            )}
          </div>
          {fitToBounds && (
            <div className="absolute left-3 z-[1] top-28">
              <FitToBounds bounds={bounds} map={map} />
            </div>
          )}
          <div
            className={`absolute top-5 right-3 map-elements-z-index items-center flex gap-x-4`}
          >
            {showCurrentZoom ? <ZoomLevel /> : null}
            {layerControl && (
              <LayerControl
                basemaps={basemaps}
                layers={layerControlLayers}
                map={map}
                hasTileServiceLayer={hasTileServiceLayer}
              />
            )}
          </div>
        </>
      ) : null}
      {/* Order according to how they'll be rendered */}
      {basemaps && <GoogleBasemapLayer map={map} />}
      {tileServiceURL && (
        <TileServiceLayer tileServiceURL={tileServiceURL} map={map} />
      )}
      {children}
      {showTileBoundaries && <TileBoundaries map={map} />}
    </div>
  );
};
