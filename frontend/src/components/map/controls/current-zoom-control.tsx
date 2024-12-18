export const ZoomLevel = ({ currentZoom }: { currentZoom: number }) => {
  return (
    <div className="bg-white py-1 px-3 rounded-md">
      <p className="text-body-4 md:text-body-3">Zoom level: {currentZoom}</p>
    </div>
  );
};
