import { useMapStore } from "@/store/map-store";

export const ZoomLevel = () => {
  const currentZoom = useMapStore((state) => state.zoom);
  return (
    <div className="rounded-lg border border-gray-border bg-white px-3 py-1.5 md:border-0">
      <p className="text-body-4 md:text-body-3">
        Zoom level: <span className="font-semibold">{currentZoom}</span>
      </p>
    </div>
  );
};
