import { useEffect, useRef } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  GOOGLE_SATELLITE_BASEMAP_LAYER_ID,
  MAP_STYLES,
  OSM_BASEMAP_LAYER_ID,
  TMS_LAYER_ID,
} from "@/utils";
import ZoomControls from "./zoom-controls";
import GeolocationControl from "./geolocation-control";
import DrawControl from "./draw-control";
import ZoomLevel from "./zoom-level";
import LayerControl from "./layer-control";
import { useMap } from "@/app/providers/map-provider";
import { setupMaplibreMap } from "./setup-maplibre";
import { BASEMAPS } from "@/enums";
import Legend from "./legend";
import TileBoundaries from "./tile-boundaries";
import OpenAerialMap from "./open-aerial-map";
import Basemaps from "./basemaps";

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
    const maplibreMap = setupMaplibreMap(
      mapContainerRef,
      MAP_STYLES[BASEMAPS.OSM],
    );
    maplibreMap.on("load", () => {
      setMap(maplibreMap);
    });
  }, []);

  return (
    <div className="h-full w-full relative" ref={mapContainerRef}>
      <div
        className={`absolute top-5 ${controlsLocation === "top-right" ? "right-3" : "left-3"} z-[1] flex flex-col gap-y-[1px]`}
      >
        {map && (
          <>
            <ZoomControls map={map} />
            {geolocationControl && <GeolocationControl map={map} />}
            {drawControl && terraDraw && <DrawControl />}
          </>
        )}
      </div>
      <div
        className={`absolute top-5 right-10 z-[1] items-center flex gap-x-4`}
      >
        {map && (
          <>
            {showCurrentZoom && <ZoomLevel />}
            {layerControl && (
              <LayerControl
                map={map}
                layers={[
                  ...layerControlLayers,
                  ...(openAerialMap
                    ? [
                        {
                          value: "TMS Layer",
                          subLayers: [TMS_LAYER_ID],
                        },
                      ]
                    : []),
                ]}
                basemaps={
                  basemaps
                    ? [
                        { value: BASEMAPS.OSM, subLayer: OSM_BASEMAP_LAYER_ID },
                        {
                          value: BASEMAPS.GOOGLE_SATELLITE,
                          subLayer: GOOGLE_SATELLITE_BASEMAP_LAYER_ID,
                        },
                      ]
                    : []
                }
              />
            )}
          </>
        )}
      </div>
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
