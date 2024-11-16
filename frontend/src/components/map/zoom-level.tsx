import { useMap } from "@/app/providers/map-provider";
import { roundNumber } from "@/utils";

const ZoomLevel = () => {
  const { currentZoom } = useMap();

  return (
    <div className="bg-white py-1 px-3 rounded-md">
      <p>Zoom level: {roundNumber(currentZoom, 0)}</p>
    </div>
  );
};

export default ZoomLevel;
