import { useMapStore } from "@/store/map-store";

export const ZoomLevel = () => {
  const currentZoom = useMapStore((state) => state.zoom);
  return (
    <div className="bg-white py-1.5 px-3 rounded-lg border border-gray-border md:border-0">
      <p className="text-body-4 md:text-body-3">
        Zoom level: <span className="font-semibold">{currentZoom}</span>
      </p>
    </div>
  );
};
