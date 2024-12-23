import {
  GOOGLE_SATELLITE_BASEMAP_LAYER_ID,
  OSM_BASEMAP_LAYER_ID,
  TMS_LAYER_ID,
} from "@/utils";
import "maplibre-gl/dist/maplibre-gl.css";
import { RefObject, useMemo } from "react";
import { BASEMAPS, DrawingModes } from "@/enums";

import { ZoomControls } from "@/components/map/controls/zoom-control";
import { GeolocationControl } from "@/components/map/controls/geolocation-control";
import { DrawControl } from "@/components/map/controls/draw-control";
import { ZoomLevel } from "@/components/map/controls/current-zoom-control";
import { LayerControl } from "@/components/map/controls/layer-control";
import { Legend } from "@/components/map/controls/legend-control";
import { TileBoundaries } from "@/components/map/layers/tile-boundaries";
import { OpenAerialMap } from "@/components/map/layers/open-aerial-map";
import { Basemaps } from "@/components/map/layers/basemaps";
import { ControlsPosition } from "@/enums";
import { LngLatBoundsLike, Map } from "maplibre-gl";
import { FitToBounds } from "./controls";
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
  showTileBoundary?: boolean;
  children?: React.ReactNode;
  showLegend?: boolean;
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
};

export const MapComponent: React.FC<MapComponentProps> = ({
  geolocationControl = false,
  controlsPosition = ControlsPosition.TOP_RIGHT,
  drawControl = false,
  showCurrentZoom = false,
  layerControl = false,
  layerControlLayers = [],
  showTileBoundary = false,
  showLegend = false,
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
  setDrawingMode,
}) => {
  const layerControlData = useMemo(() => {
    const layers = [
      ...layerControlLayers,
      ...(openAerialMap
        ? [{ value: "TMS Layer", subLayers: [TMS_LAYER_ID] }]
        : []),
    ];
    const baseLayers = basemaps
      ? [
          { value: BASEMAPS.OSM, subLayer: OSM_BASEMAP_LAYER_ID },
          {
            value: BASEMAPS.GOOGLE_SATELLITE,
            subLayer: GOOGLE_SATELLITE_BASEMAP_LAYER_ID,
          },
        ]
      : [];
    return { layers, baseLayers };
  }, [layerControlLayers, openAerialMap, basemaps]);

  const Controls = useMemo(() => {
    if (!map) return;
    return (
      <>
        <div
          className={`absolute top-5 ${
            controlsPosition === ControlsPosition.TOP_RIGHT
              ? "right-3"
              : "left-3"
          } z-[1] flex flex-col gap-y-[1px]`}
        >
          {currentZoom ? (
            <ZoomControls map={map} currentZoom={currentZoom} />
          ) : null}
          {fitToBounds ? (
            <FitToBounds
              onClick={() =>
                map?.fitBounds(bounds as LngLatBoundsLike, { padding: 10 })
              }
            />
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
        <div
          className={`absolute top-5 right-3 z-[1] items-center flex gap-x-4`}
        >
          {showCurrentZoom && currentZoom ? (
            <ZoomLevel currentZoom={currentZoom} />
          ) : null}
          {layerControl && (
            <LayerControl
              basemaps={layerControlData?.baseLayers}
              layers={layerControlData?.layers}
              map={map}
            />
          )}
        </div>
      </>
    );
  }, [
    map,
    geolocationControl,
    drawControl,
    terraDraw,
    controlsPosition,
    layerControl,
    showCurrentZoom,
    layerControlData,
    currentZoom,
    drawingMode && setDrawingMode,
    fitToBounds,
  ]);

  return (
    <div className={`h-full relative w-full`} ref={mapContainerRef}>
      {Controls}
      {map && showLegend && <Legend map={map} />}
      {/* Order according to how they'll be rendered */}
      {basemaps && <Basemaps map={map} />}
      {openAerialMap && oamTileJSONURL && (
        <OpenAerialMap tileJSONURL={oamTileJSONURL} map={map} />
      )}
      {showTileBoundary && <TileBoundaries map={map} />}
      {children}
    </div>
  );
};
