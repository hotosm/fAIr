import { useMap } from "@/app/providers/map-provider";

const ZoomLevel = () => {
  const { currentZoom } = useMap();
  return (
    <div className="bg-white py-1 px-3 rounded-md">
      <p className="text-body-4 md:text-body-3">Zoom level: {currentZoom}</p>
    </div>
  );
};

export default ZoomLevel;
