import { MapComponent } from "@/components/map";

const TrainingAreaMap = () => {
  return (
    <div className="w-full h-full col-span-4">
      <MapComponent controlsLocation="top-left" drawControl showCurrentZoom />
    </div>
  );
};

export default TrainingAreaMap;
