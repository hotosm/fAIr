import { useMap } from "@/app/providers/map-provider";
import { MapComponent } from "@/components/map";
import { PaginatedTrainingArea } from "@/types";
import { LayerSpecification, SourceSpecification } from "maplibre-gl";
import { useEffect } from "react";

const TrainingAreaMap = ({
  tileJSONURL,
  data,
  trainingDatasetId,
}: {
  tileJSONURL: string;
  data?: PaginatedTrainingArea;
  trainingDatasetId: number;
}) => {
  const TMSLayerId = "training-dataset-tms-layer";
  const TMSSourceId = `oam-training-dataset-${trainingDatasetId}`;
  const trainingAreasLayerId = `dataset-${trainingDatasetId}-training-area-layer`;
  const trainingAreasSourced = `dataset-${trainingDatasetId}-training-area-source`;

  const trainingAreaLayer = {
    id: trainingAreasLayerId,
    type: "line",
    source: trainingAreasSourced,
    paint: {
      "line-color": "#d63f40", // hot-primary
      "line-width": 3,
    },
    layout: {
      visibility: "visible",
    },
  } as LayerSpecification;

  const trainingAreaSource = {
    type: "geojson",
    data: data?.results,
  } as SourceSpecification;

  const { map } = useMap();
  const mapData = data?.results;

  useEffect(() => {
    if (!map || !map.isStyleLoaded()) return;

    const updateTMSLayer = () => {
      if (!map.getSource(TMSSourceId)) {
        map.addSource(TMSSourceId, {
          type: "raster",
          url: tileJSONURL,
        });
      }

      if (!map.getLayer(TMSLayerId)) {
        map.addLayer({
          id: TMSLayerId,
          type: "raster",
          source: TMSSourceId,
          paint: {
            "raster-opacity": 1,
          },
          layout: {
            visibility: "visible",
          },
        });
      }
    };

    const updateGeoJSONLayer = () => {
      if (map.getSource(trainingAreasSourced)) {
        //@ts-expect-error bad type definition
        map.getSource(trainingAreasSourced).setData(mapData);
      } else {
        map.addSource(trainingAreasSourced, trainingAreaSource);

        if (!map.getLayer(trainingAreasLayerId)) {
          map.addLayer(trainingAreaLayer);
        }
      }
    };

    const onStyleData = () => {
      updateTMSLayer();
      updateGeoJSONLayer();
    };
    onStyleData();
    // Attach the listener for style changes
    map.on("styledata", onStyleData);

    return () => {
      if (map.getLayer(trainingAreasLayerId)) {
        map.removeLayer(trainingAreasLayerId);
      }
      if (map.getSource(trainingAreasSourced)) {
        map.removeSource(trainingAreasSourced);
      }
      if (map.getLayer(TMSLayerId)) {
        map.removeLayer(TMSLayerId);
      }
      if (map.getSource(TMSSourceId)) {
        map.removeSource(TMSSourceId);
      }

      map.off("styledata", onStyleData);
    };
  }, [map, mapData, tileJSONURL]);

  // add the draw as a new source that continues to increment
  // add an effect to check when a draw is completed then save it and reload the draw
  // store the drawing in the state to confirm the user has drawn before moving to the next step.

  return (
    <MapComponent
      controlsLocation="top-left"
      drawControl
      showCurrentZoom
      layerControl
      layerControlLayers={[
        {
          value: "TMS Layer",
          mapLayerId: TMSLayerId,
        },
        // @ts-expect-error bad type definition
        ...(mapData?.features?.length > 0
          ? [
            {
              value: "Training Areas",
              mapLayerId: trainingAreasLayerId,
            },
          ]
          : []),
      ]}
    />
  );
};

export default TrainingAreaMap;
