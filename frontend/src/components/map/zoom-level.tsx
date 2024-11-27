import { useMap } from "@/app/providers/map-provider";


const ZoomLevel = () => {
  const { currentZoom } = useMap();
  return (
    <div className="bg-white py-1 px-3 rounded-md">
      <p>Zoom level: {Math.floor(currentZoom)}</p>
    </div>
  );
};

export default ZoomLevel;
