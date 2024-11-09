import { Map } from "maplibre-gl";
import { useEffect, useState } from "react";

const ZoomLevel = ({ map }: { map: Map | null }) => {
  const [currentZoom, setCurrentZoom] = useState<number>(0);

  useEffect(() => {
    if (!map) return;

    setCurrentZoom(map?.getZoom());
  }, [map]);

  useEffect(() => {
    if (!map) return;
    const updateCurrentZoom = () => {
      setCurrentZoom(map?.getZoom());
    };
    map.on("zoomend", updateCurrentZoom);
    return () => {
      map.off("zoomend", updateCurrentZoom);
    };
  }, [map]);

  return (
    <div className="bg-white py-1 px-3 rounded-md">
      <p>Zoom level: {currentZoom.toFixed(1)}</p>
    </div>
  );
};

export default ZoomLevel;
