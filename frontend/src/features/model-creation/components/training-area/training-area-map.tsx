import { MapComponent } from "@/components/map";
import { Map } from "maplibre-gl";

const TrainingAreaMap = ({
  tileJSONURL,
  sourceId,
  layerId,
  setMap,
}: {
  tileJSONURL: string;
  sourceId: string;
  layerId: string;
  setMap: (map: Map) => void;
}) => {
  return (
    <MapComponent
      controlsLocation="top-left"
      drawControl
      showCurrentZoom
      layerControl
      onMapLoad={setMap}
      layerControlLayers={[
        {
          value: "TMS Layer",
          // The Id should be the same as the specification layer
          mapLayerId: layerId,
        },
      ]}
      sources={[
        {
          sourceId: sourceId,
          spec: {
            type: "raster",
            url: tileJSONURL,
          },
        },
      ]}
      layers={[
        {
          id: layerId,
          type: "raster",
          source: sourceId,
          paint: {
            "raster-opacity": 1,
          },
        },
      ]}
    />
  );
};

export default TrainingAreaMap;
