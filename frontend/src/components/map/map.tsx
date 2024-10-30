import { useEffect, useRef, useState } from "react";
import maplibregl, { Map } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { MAP_STYLES } from "@/config";
import ZoomControls from "./zoom-controls";
import GeolocationControl from "./geolocation-control";
import DrawControl from "./draw-control";
import ZoomLevel from "./zoom-level";
import LayerControl from "./layer-control";

type MapComponentProps = {
  onMapLoad?: (map: Map) => void;
  geolocationControl?: boolean;
  controlsLocation?: "top-right" | "top-left";
  drawControl?: boolean;
  showCurrentZoom?: boolean;
  layerControl?: boolean;
};

const MapComponent: React.FC<MapComponentProps> = ({
  onMapLoad,
  geolocationControl = false,
  controlsLocation = "top-right",
  drawControl = false,
  showCurrentZoom = false,
  layerControl = false,
}) => {
  const mapRef = useRef(null);
  const [map, setMap] = useState<Map | null>(null);
  const [selectedBasemap, setSelectedBasemap] = useState<string>("OSM");

  useEffect(() => {
    if (!mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapRef.current,
      //@ts-ignore
      style: MAP_STYLES[selectedBasemap],
      center: [0, 0],
      zoom: 0.5,
      minZoom: 1,
      maxZoom: 18,
    });
    map.on("load", () => {
      onMapLoad?.(map);
      setMap(map);
    });

    return () => map.remove();
  }, []);

  // Update basemap.
  useEffect(() => {
    if (!map) return;
    {
      /* @ts-expect-error bad type definition */
    }
    map.setStyle(MAP_STYLES[selectedBasemap]);
  }, [selectedBasemap]);

  return (
    <div className="h-full w-full relative" ref={mapRef}>
      <div
        className={`absolute top-5 ${controlsLocation === "top-right" ? "right-3" : "left-3"} z-[10] flex flex-col gap-y-[1px]`}
      >
        <ZoomControls map={map} />
        {geolocationControl && <GeolocationControl map={map} />}
        {drawControl && <DrawControl map={map} />}
      </div>
      <div
        className={`absolute top-5 right-10 z-[10] items-center flex gap-x-4`}
      >
        {showCurrentZoom && <ZoomLevel map={map} />}
        {layerControl && (
          <LayerControl
            selectedBasemap={selectedBasemap}
            setSelectedBasemap={setSelectedBasemap}
          />
        )}
      </div>
    </div>
  );
};

export default MapComponent;
