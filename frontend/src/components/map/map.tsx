import { useEffect, useRef, useState } from "react";
import maplibregl, { Map } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { MAP_STYLE } from "@/config";
import ZoomControls from "./zoom-controls";
import GeolocationControl from "./geolocation-control";
import DrawControl from "./draw-control";
import ZoomLevel from "./zoom-level";

type MapComponentProps = {
  onMapLoad?: (map: Map) => void;
  geolocationControl?: boolean;
  controlsLocation?: "top-right" | "top-left";
  drawControl?: boolean;
  showCurrentZoom?: boolean;
};

const MapComponent: React.FC<MapComponentProps> = ({
  onMapLoad,
  geolocationControl = false,
  controlsLocation = "top-right",
  drawControl = false,
  showCurrentZoom = false,
}) => {
  const mapRef = useRef(null);
  const [map, setMap] = useState<Map | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapRef.current,
      //@ts-ignore
      style: MAP_STYLE,
      center: [0, 0],
      zoom: 0.5,
      minZoom: 1,
      maxZoom: 18,
    });
    onMapLoad?.(map);
    setMap(map);
    return () => map.remove();
  }, []);

  return (
    <div className="h-full w-full relative" ref={mapRef}>
      <div
        className={`absolute top-5 left-3 ${controlsLocation === "top-right" ? "right-3" : "left-3"} z-[10] flex flex-col gap-y-[1px]`}
      >
        <ZoomControls map={map} />
        {geolocationControl && <GeolocationControl map={map} />}
        {drawControl && <DrawControl map={map} />}
      </div>
      <div className={`absolute top-5 right-10 z-[10]`}>
        {showCurrentZoom && <ZoomLevel map={map} />}
      </div>
    </div>
  );
};

export default MapComponent;
