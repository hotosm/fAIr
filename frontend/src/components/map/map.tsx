import "maplibre-gl/dist/maplibre-gl.css";
import { RefObject } from "react";
import { DrawingModes } from "@/enums";
import {
  GeolocationControl,
  FitToBounds,
  DrawControl,
  ZoomLevel,
  LayerControl,
  ZoomControls,
} from "@/components/map/controls";
import { TileBoundaries } from "@/components/map/layers/tile-boundaries";
import { OpenAerialMap } from "@/components/map/layers/open-aerial-map";
import { Basemaps } from "@/components/map/layers/basemaps";
import { ControlsPosition } from "@/enums";
import { LngLatBoundsLike, Map } from "maplibre-gl";
import { TerraDraw } from "terra-draw";

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
  openAerialMap?: boolean;
  oamTileJSONURL?: string;
  basemaps?: boolean;
  fitToBounds?: boolean;
  bounds?: LngLatBoundsLike;
  // layers?: LayerSpecification[]
  // sources?: { id: string; spec: SourceSpecification }[],
  onMapLoad?: (map: Map) => void;
  mapContainerRef?: RefObject<HTMLDivElement> | null;
  map: Map | null;
  terraDraw?: TerraDraw | undefined;
  currentZoom?: number;
  drawingMode?: DrawingModes;
  setDrawingMode?: (newMode: DrawingModes) => void;
  zoomControls?: boolean;
};

export const MapComponent: React.FC<MapComponentProps> = ({
  geolocationControl = false,
  controlsPosition = ControlsPosition.TOP_RIGHT,
  drawControl = false,
  showCurrentZoom = false,
  layerControl = false,
  layerControlLayers = [],
  showTileBoundaries = false,
  openAerialMap = false,
  oamTileJSONURL,
  basemaps = false,
  children,
  fitToBounds,
  bounds,
  mapContainerRef,
  map,
  terraDraw,
  currentZoom,
  drawingMode,
  zoomControls = true,
  setDrawingMode,
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
            {currentZoom && zoomControls ? (
              <ZoomControls map={map} currentZoom={currentZoom} />
            ) : null}
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
            {showCurrentZoom && currentZoom ? (
              <ZoomLevel currentZoom={currentZoom} />
            ) : null}
            {layerControl && (
              <LayerControl
                basemaps={basemaps}
                layers={layerControlLayers}
                map={map}
                openAerialMap={openAerialMap}
              />
            )}
          </div>
        </>
      ) : null}
      {/* Order according to how they'll be rendered */}
      {basemaps && <Basemaps map={map} />}
      {openAerialMap && oamTileJSONURL && (
        <OpenAerialMap tileJSONURL={oamTileJSONURL} map={map} />
      )}
      {showTileBoundaries && <TileBoundaries map={map} />}
      {children}
    </div>
  );
};
