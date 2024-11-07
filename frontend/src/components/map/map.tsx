import { useEffect, useRef, useState } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import { MAP_STYLES } from "@/config";
import ZoomControls from "./zoom-controls";
import GeolocationControl from "./geolocation-control";
import DrawControl from "./draw-control";
import ZoomLevel from "./zoom-level";
import LayerControl from "./layer-control";
import { useMap } from "@/app/providers/map-provider";
import { setupMaplibreMap } from "./setup-maplibre";

type MapComponentProps = {
  geolocationControl?: boolean;
  controlsLocation?: "top-right" | "top-left";
  drawControl?: boolean;
  showCurrentZoom?: boolean;
  layerControl?: boolean;
  layerControlLayers?: {
    value: string;
    mapLayerId: string;
  }[];
};

const MapComponent: React.FC<MapComponentProps> = ({
  geolocationControl = false,
  controlsLocation = "top-right",
  drawControl = false,
  showCurrentZoom = false,
  layerControl = false,
  layerControlLayers = [],
}) => {
  const mapContainerRef = useRef(null);
  const [selectedBasemap, setSelectedBasemap] = useState<string>("OSM");
  const { map, setMap, terraDraw } = useMap();

  useEffect(() => {
    const maplibreMap = setupMaplibreMap(
      mapContainerRef,
      MAP_STYLES[selectedBasemap],
    );
    maplibreMap.on("load", () => {
      setMap(maplibreMap);
    });
  }, []);

  // Update the map style whenever the selected basemap changes
  useEffect(() => {
    if (!map) return;
    map.setStyle(MAP_STYLES[selectedBasemap]);
  }, [selectedBasemap, map]);

  return (
    <div className="h-full w-full relative" ref={mapContainerRef}>
      <div
        className={`absolute top-5 ${controlsLocation === "top-right" ? "right-3" : "left-3"} z-[10] flex flex-col gap-y-[1px]`}
      >
        {map && (
          <>
            <ZoomControls map={map} />
            {geolocationControl && <GeolocationControl map={map} />}
            {drawControl && terraDraw && <DrawControl terraDraw={terraDraw} />}
          </>
        )}
      </div>
      <div
        className={`absolute top-5 right-10 z-[10] items-center flex gap-x-4`}
      >
        {map && (
          <>
            {showCurrentZoom && <ZoomLevel map={map} />}
            {layerControl && (
              <LayerControl
                selectedBasemap={selectedBasemap}
                setSelectedBasemap={setSelectedBasemap}
                map={map}
                layers={layerControlLayers}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MapComponent;
