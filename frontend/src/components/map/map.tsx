import {
  GOOGLE_SATELLITE_BASEMAP_LAYER_ID,
  MAP_STYLES,
  OSM_BASEMAP_LAYER_ID,
  TMS_LAYER_ID,
} from "@/utils";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useMemo, useRef } from "react";

import { useMap } from "@/app/providers/map-provider";
import { setupMaplibreMap } from "@/components/map/setup-maplibre";
import { BASEMAPS } from "@/enums";

import ZoomControls from "@/components/map/zoom-controls";
import GeolocationControl from "@/components/map/geolocation-control";
import DrawControl from "@/components/map/draw-control";
import ZoomLevel from "@/components/map/zoom-level";
import LayerControl from "@/components/map/layer-control";
import Legend from "@/components/map/legend";
import TileBoundaries from "@/components/map/tile-boundaries";
import OpenAerialMap from "@/components/map/open-aerial-map";
import Basemaps from "@/components/map/basemaps";

type MapComponentProps = {
  geolocationControl?: boolean;
  controlsLocation?: "top-right" | "top-left";
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
};

const MapComponent: React.FC<MapComponentProps> = ({
  geolocationControl = false,
  controlsLocation = "top-right",
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
}) => {
  const mapContainerRef = useRef(null);
  const { map, setMap, terraDraw } = useMap();

  useEffect(() => {
    if (!map) {
      const maplibreMap = setupMaplibreMap(
        mapContainerRef,
        MAP_STYLES[BASEMAPS.OSM],
      );
      maplibreMap.on("load", () => {
        setMap(maplibreMap);
      });
    }
  }, [map, setMap]);

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
          className={`absolute top-5 ${controlsLocation === "top-right" ? "right-3" : "left-3"
            } z-[1] flex flex-col gap-y-[1px]`}
        >
          <ZoomControls />
          {geolocationControl && <GeolocationControl />}
          {drawControl && terraDraw && <DrawControl />}
        </div>
        <div
          className={`absolute top-5 right-10 z-[1] items-center flex gap-x-4`}
        >
          {showCurrentZoom && <ZoomLevel />}
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
    controlsLocation,
    layerControl,
    showCurrentZoom,
    layerControlData,
  ]);

  return (
    <div className="h-full w-full relative" ref={mapContainerRef}>
      {Controls}
      {map && showLegend && <Legend />}
      {/* Order according to how they'll be rendered */}
      {basemaps && <Basemaps />}
      {openAerialMap && <OpenAerialMap tileJSONURL={oamTileJSONURL} />}
      {showTileBoundary && <TileBoundaries />}
      {children}
    </div>
  );
};

export default MapComponent;
