import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { MAP_STYLES } from "@/config";
import ZoomControls from "./zoom-controls";
import GeolocationControl from "./geolocation-control";
import DrawControl from "./draw-control";
import ZoomLevel from "./zoom-level";
import LayerControl from "./layer-control";
import { useMap } from "@/app/providers/map-provider";

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
  const { map, setMap } = useMap();
  const [mapIsReady, setMapIsReady] = useState<boolean>(false);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      //@ts-ignore
      style: MAP_STYLES[selectedBasemap],
      center: [0, 0],
      zoom: 0.5,
      minZoom: 1,
      maxZoom: 21,
    });

    const onStyleLoad = () => {
      setMap(map);
      setMapIsReady(true);
    };

    map.on("style.load", () => {
      onStyleLoad();
    });

    return () => {
      map.off("style.load", onStyleLoad);
      map.remove();
    };
  }, []);

  useEffect(() => {
    if (!mapIsReady) return;
    map?.setStyle(MAP_STYLES[selectedBasemap]);
  }, [selectedBasemap]);

  return (
    <div className="h-full w-full relative" ref={mapContainerRef}>
      <div
        className={`absolute top-5 ${controlsLocation === "top-right" ? "right-3" : "left-3"} z-[10] flex flex-col gap-y-[1px]`}
      >
        {mapIsReady && (
          <>
            <ZoomControls map={map} />
            {geolocationControl && <GeolocationControl map={map} />}
            {drawControl && <DrawControl map={map} />}
          </>
        )}
      </div>
      <div
        className={`absolute top-5 right-10 z-[10] items-center flex gap-x-4`}
      >
        {mapIsReady && (
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
