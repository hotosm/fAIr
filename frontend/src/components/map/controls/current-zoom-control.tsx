export const ZoomLevel = ({ currentZoom }: { currentZoom: number }) => {
  return (
    <div className="bg-white py-1.5 px-3 rounded-lg border border-gray-border md:border-0">
      <p className="text-body-4 md:text-body-3">Zoom level: {currentZoom}</p>
    </div>
  );
};
