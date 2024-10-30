import { MapComponent } from "@/components/map";

const TrainingAreaMap = () => {
  return (
    <MapComponent
      controlsLocation="top-left"
      drawControl
      showCurrentZoom
      layerControl
    />
  );
};

export default TrainingAreaMap;
