import { useMap } from "@/app/providers/map-provider";
import { MapComponent } from "@/components/map";
import { PaginatedTrainingArea } from "@/types";
import { GeoJSONSourceSpecification, LayerSpecification } from "maplibre-gl";
import { useCallback, useEffect } from "react";
import { useCreateTrainingArea } from "../../hooks/use-training-areas";
import { geojsonToWKT } from "@terraformer/wkt";
import { useToastNotification } from "@/hooks/use-toast-notification";

const TrainingAreaMap = ({
  tileJSONURL,
  data,
  trainingDatasetId,
}: {
  tileJSONURL: string;
  data?: PaginatedTrainingArea;
  trainingDatasetId: number;
}) => {
  const { map, terraDraw } = useMap();
  const toast = useToastNotification();
  const TMSLayerId = `training-dataset-tms-layer`;
  const TMSSourceId = `oam-training-dataset-${trainingDatasetId}`;
  const trainingAreasLayerId = `dataset-${trainingDatasetId}-training-area-layer`;
  const trainingAreasSourceId = `dataset-${trainingDatasetId}-training-area-source`;
  const createTrainingArea = useCreateTrainingArea({
    datasetId: Number(trainingDatasetId),
  });

  const applyLayerChanges = useCallback(
    (layerUpdateFn: () => void) => {
      if (!map) return;
      if (map.isStyleLoaded()) {
        layerUpdateFn();
      } else {
        map.on("styledata", layerUpdateFn);
      }
    },
    [map],
  );

  const updateTMSLayer = useCallback(() => {
    if (!map?.getSource(TMSSourceId)) {
      map?.addSource(TMSSourceId, { type: "raster", url: tileJSONURL });
    }
    if (!map?.getLayer(TMSLayerId)) {
      map?.addLayer({
        id: TMSLayerId,
        type: "raster",
        source: TMSSourceId,
        paint: { "raster-opacity": 1 },
        layout: { visibility: "visible" },
      });
    }
  }, [map, TMSSourceId, TMSLayerId, tileJSONURL]);

  const updateTrainingAreasLayer = useCallback(() => {
    if (!data?.results) return;

    if (map?.getSource(trainingAreasSourceId)) {
      //@ts-expect-error bad type definition
      map.getSource(trainingAreasSourceId)?.setData(data?.results);
    } else {
      map?.addSource(trainingAreasSourceId, {
        type: "geojson",
        data: data?.results,
      } as GeoJSONSourceSpecification);

      if (!map?.getLayer(trainingAreasLayerId)) {
        map?.addLayer({
          id: trainingAreasLayerId,
          type: "line",
          source: trainingAreasSourceId,
          paint: { "line-color": "rgb(51, 136, 255)", "line-width": 4 },
          layout: { visibility: "visible" },
        } as LayerSpecification);
      }
    }
  }, [map, data?.results, trainingAreasSourceId, trainingAreasLayerId]);

  const bringTrainingAreaLayerToTop = useCallback(() => {
    if (map?.getLayer(trainingAreasLayerId) && map?.getLayer(TMSLayerId)) {
      map.moveLayer(TMSLayerId, trainingAreasLayerId);
    }
  }, [map, trainingAreasLayerId, TMSLayerId]);

  useEffect(() => {
    applyLayerChanges(updateTMSLayer);
    return () => {
      if (map?.getLayer(TMSLayerId)) map.removeLayer(TMSLayerId);
      if (map?.getSource(TMSSourceId)) map.removeSource(TMSSourceId);
    };
  }, [map, applyLayerChanges, updateTMSLayer]);

  useEffect(() => {
    if (!data?.results) return;
    applyLayerChanges(updateTrainingAreasLayer);
    return () => {
      if (map?.getLayer(trainingAreasLayerId))
        map.removeLayer(trainingAreasLayerId);
      if (map?.getSource(trainingAreasSourceId))
        map.removeSource(trainingAreasSourceId);
    };
  }, [map, applyLayerChanges, updateTrainingAreasLayer, data?.results]);

  useEffect(() => {
    const handleStyleData = () => {
      applyLayerChanges(updateTrainingAreasLayer);
      applyLayerChanges(updateTMSLayer);
      bringTrainingAreaLayerToTop();
    };

    if (map) {
      map.on("styledata", handleStyleData);
    }

    return () => {
      if (map) {
        map.off("styledata", handleStyleData);
      }
    };
  }, [
    map,
    applyLayerChanges,
    updateTMSLayer,
    updateTrainingAreasLayer,
    bringTrainingAreaLayerToTop,
  ]);

  useEffect(() => {
    if (!terraDraw) return;

    const handleFinish = async () => {
      const snapshot = terraDraw.getSnapshot();
      // add snapping and validation
      // save to api and mutate
      // no need to update local state?
      if (snapshot) {
        const wkt = geojsonToWKT(snapshot[0].geometry);
        await createTrainingArea.mutateAsync(
          {
            dataset: String(trainingDatasetId),
            geom: `SRID=4326;${wkt}`,
          },
          {
            onSuccess: () => {
              toast("Training area created successfully", "success");
            },
          },
        );
        terraDraw.clear();
      }
    };

    terraDraw.on("finish", handleFinish);
    return () => terraDraw.off("finish", handleFinish);
  }, [terraDraw]);

  return (
    <MapComponent
      controlsLocation="top-left"
      drawControl
      showCurrentZoom
      layerControl
      layerControlLayers={[
        { value: "TMS Layer", mapLayerId: TMSLayerId },
        ...(data?.results?.features?.length
          ? [{ value: "Training Areas", mapLayerId: trainingAreasLayerId }]
          : []),
      ]}
    />
  );
};

export default TrainingAreaMap;
