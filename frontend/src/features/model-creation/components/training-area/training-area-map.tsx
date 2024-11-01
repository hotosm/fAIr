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
      "line-color": "black",
      "line-width": 2,
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

    updateTMSLayer();
    updateGeoJSONLayer();

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
    };
  }, [map, mapData]);

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
        {
          value: "Training Areas",
          mapLayerId: trainingAreasLayerId,
        },
      ]}
    />
  );
};

export default TrainingAreaMap;
