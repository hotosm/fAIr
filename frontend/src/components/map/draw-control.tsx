import { Map } from "maplibre-gl";

 // @ts-expect-error bad type definition
const DrawControl = ({ map }: { map: Map | null }) => {
  const handleDraw = () => {};

  return (
    <button
      className="p-1.5 bg-primary flex items-center justify-center"
      onClick={handleDraw}
    >
      <div className="border-2 border-white rounded-md h-4 w-4"></div>
    </button>
  );
};

export default DrawControl;
