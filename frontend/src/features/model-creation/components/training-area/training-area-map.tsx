import { useMap } from "@/app/providers/map-provider";
import { MapComponent } from "@/components/map";
import { PaginatedTrainingArea } from "@/types";
import { GeoJSONSourceSpecification } from "maplibre-gl";
import { useCallback, useEffect, useState } from "react";
import {
  useCreateTrainingArea,
  useGetTrainingDatasetLabels,
} from "@/features/model-creation/hooks/use-training-areas";
import { geojsonToWKT } from "@terraformer/wkt";
import { useToastNotification } from "@/hooks/use-toast-notification";
import {
  getTileBoundariesGeoJSON,
  snapGeoJSONGeometryToClosestTile,
  validateGeoJSONArea,
} from "@/utils";

import useDebounce from "@/hooks/use-debounce";
import { BASEMAPS } from "@/enums";

const TrainingAreaMap = ({
  tileJSONURL,
  data,
  trainingDatasetId,
  offset,
}: {
  tileJSONURL: string;
  data?: PaginatedTrainingArea;
  trainingDatasetId: number;
  offset: number;
}) => {
  const { map, terraDraw } = useMap();
  const toast = useToastNotification();
  const OSMBasemapLayerId = "osm-layer";
  const GoogleSatelliteLayerId = "google-statellite-layer";
  const GoogleSatelliteSourceId = "google-satellite";
  const TMSLayerId = `training-dataset-tms-layer`;
  const TMSSourceId = `oam-training-dataset-${trainingDatasetId}`;
  const trainingAreasLayerId = `dataset-${trainingDatasetId}-training-area-layer`;
  const trainingDatasetLabelsSourceId = `dataset-${trainingDatasetId}-training-labels-source`;
  const trainingAreasSourceId = `dataset-${trainingDatasetId}-training-area-source`;
  const trainingDatasetLabelsLayerId = `dataset-${trainingDatasetId}-training-labels-fill-layer`;
  const trainingDatasetLabelsOutlineLayerId = `dataset-${trainingDatasetId}-training-labels-outline-layer`;
  const tileBoundarylayerId = "tile-boundary-layer";
  const tileBoundarySourceId = "tile-boundaries";
  const [currentZoom, setCurrentZoom] = useState<number>(0);
  const [bbox, setBbox] = useState("");

  const debouncedBbox = useDebounce(bbox, 300);
  const debouncedZoom = useDebounce(currentZoom.toString(), 300);

  const { data: labels } = useGetTrainingDatasetLabels(
    trainingDatasetId,
    debouncedBbox,
    Number(debouncedZoom),
  );

  const createTrainingArea = useCreateTrainingArea({
    datasetId: Number(trainingDatasetId),
    offset,
  });

  /**
   * Callbacks
   */

  const initializeSourcesAndLayers = useCallback(() => {
    if (!map || !map.isStyleLoaded()) return;

    /**
     * Sources
     */
    // Only Google Satellite is added because the basemap style defaults to OSM, so when the visibility of Google Satellite it none, OSM will show up.
    if (!map.getSource(GoogleSatelliteSourceId)) {
      map.addSource(GoogleSatelliteSourceId, {
        type: "raster",
        tiles: [
          "https://mt0.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
          "https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
          "https://mt2.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
          "https://mt3.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
        ],
        attribution: "&copy; Google",
      });
    }

    if (!map.getSource(TMSSourceId)) {
      map.addSource(TMSSourceId, { type: "raster", url: tileJSONURL });
    }

    if (data?.results && !map.getSource(trainingAreasSourceId)) {
      map.addSource(trainingAreasSourceId, {
        type: "geojson",
        data: data.results,
      } as GeoJSONSourceSpecification);
    }

    if (!map.getSource(trainingDatasetLabelsSourceId)) {
      map.addSource(trainingDatasetLabelsSourceId, {
        type: "geojson",
        data: labels ?? {
          type: "FeatureCollection",
          features: [],
        },
      } as GeoJSONSourceSpecification);
    }

    if (!map.getSource(tileBoundarySourceId)) {
      const tileBoundaries = getTileBoundariesGeoJSON(
        map,
        Math.floor(map.getZoom()),
      );
      map.addSource(tileBoundarySourceId, {
        type: "geojson",
        data: tileBoundaries,
      });
    }

    /**
     * Layers
     */

    if (!map.getLayer(GoogleSatelliteLayerId)) {
      map.addLayer({
        id: GoogleSatelliteLayerId,
        type: "raster",
        source: GoogleSatelliteSourceId,
        layout: { visibility: "none" },
        minzoom: 0,
        maxzoom: 22,
      });
    }

    if (!map.getLayer(TMSLayerId)) {
      map.addLayer({
        id: TMSLayerId,
        type: "raster",
        source: TMSSourceId,
        layout: { visibility: "visible" },
      });
    }

    if (data?.results && !map.getLayer(trainingAreasLayerId)) {
      map.addLayer({
        id: trainingAreasLayerId,
        type: "line",
        source: trainingAreasSourceId,
        paint: { "line-color": "rgb(51, 136, 255)", "line-width": 4 },
        layout: { visibility: "visible" },
      });
    }

    if (!map.getLayer(trainingDatasetLabelsLayerId)) {
      map.addLayer({
        id: trainingDatasetLabelsLayerId,
        type: "fill",
        source: trainingDatasetLabelsSourceId,
        paint: {
          "fill-color": "#D73434",
          "fill-opacity": 0.3,
          "fill-outline-color": "#D73434",
        },
        minzoom: 19,
        layout: { visibility: "visible" },
      });
    }
    if (!map.getLayer(trainingDatasetLabelsOutlineLayerId)) {
      map.addLayer({
        id: trainingDatasetLabelsOutlineLayerId,
        type: "line",
        source: trainingDatasetLabelsSourceId,
        paint: {
          "line-color": "#D73434",
          "line-width": 2,
        },
        minzoom: 19,
        layout: { visibility: "visible" },
      });
    }

    if (!map.getLayer(tileBoundarylayerId)) {
      map.addLayer({
        id: tileBoundarylayerId,
        type: "line",
        source: tileBoundarySourceId,
        paint: {
          "line-color": "#FFF",
          "line-width": 1,
        },
        layout: { visibility: "visible" },
      });
    }
  }, [map, tileJSONURL, data?.results, labels]);

  const organizeLayers = useCallback(() => {
    if (!map) return;
    if (map.getLayer(TMSLayerId) && map.getLayer(trainingAreasLayerId)) {
      map.moveLayer(trainingAreasLayerId);
    }
    if (
      map.getLayer(trainingAreasLayerId) &&
      map.getLayer(tileBoundarylayerId)
    ) {
      map.moveLayer(tileBoundarylayerId, trainingAreasLayerId);
    }
  }, [map, TMSLayerId, trainingAreasLayerId]);

  const updateTrainingLabels = useCallback(() => {
    if (map) {
      if (map.getSource(trainingDatasetLabelsSourceId) && labels) {
        map.getSource(trainingDatasetLabelsSourceId)?.setData(labels);
      }
    }
  }, [map, labels]);

  const updateTrainingArea = useCallback(() => {
    if (map) {
      if (map.getSource(trainingAreasSourceId) && data?.results) {
        map.getSource(trainingAreasSourceId)?.setData(data.results);
      }
    }
  }, [map, data?.results]);

  const updateTileBoundary = useCallback(() => {
    if (map) {
      if (map.getSource(tileBoundarySourceId)) {
        const tileBoundaries = getTileBoundariesGeoJSON(
          map,
          Math.floor(map.getZoom()),
        );
        map.getSource(tileBoundarySourceId)?.setData(tileBoundaries);
      }
    }
  }, [map]);

  const updateZoomAndBbox = useCallback(() => {
    if (!map) return;
    setCurrentZoom(map.getZoom());
    const bounds = map.getBounds();
    const newBbox = `${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`;
    setBbox(newBbox);
  }, [map]);

  /**
   * Effects
   */
  useEffect(() => {
    if (!map) return;
    const moveUpdates = () => {
      updateZoomAndBbox();
      updateTileBoundary();
    };
    map.on("moveend", moveUpdates);
    return () => {
      map.off("moveend", moveUpdates);
    };
  }, [map]);

  useEffect(() => {
    if (!map) return;

    const onStyleData = () => {
      initializeSourcesAndLayers();
      organizeLayers();
    };

    if (!map.isStyleLoaded()) {
      map.once("styledata", onStyleData);
    } else {
      onStyleData();
    }

    return () => {
      map.off("styledata", onStyleData);
    };
  }, [map, initializeSourcesAndLayers, organizeLayers]);

  useEffect(() => {
    if (!data?.results) return;
    updateTrainingArea();
  }, [data?.results]);

  useEffect(() => {
    if (!labels) return;
    updateTrainingLabels();
  }, [labels]);

  // handle drawing events
  useEffect(() => {
    if (!terraDraw || !map) return;

    const handleFinish = async () => {
      const snapshot = terraDraw.getSnapshot();
      if (snapshot) {
        const drawnFeature = snapshot[snapshot.length - 1];
        // Don't accept the drawing if they don't meet the size criteria
        if (validateGeoJSONArea(drawnFeature)) {
          terraDraw.clear();
          return;
        }
        snapGeoJSONGeometryToClosestTile(drawnFeature.geometry);
        const wkt = geojsonToWKT(drawnFeature.geometry);
        await createTrainingArea.mutateAsync(
          { dataset: String(trainingDatasetId), geom: `SRID=4326;${wkt}` },
          {
            onSuccess: () =>
              toast("Training area created successfully", "success"),
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
      layerControlBasemaps={[
        { value: BASEMAPS.OSM, mapLayerId: OSMBasemapLayerId },
        {
          value: BASEMAPS.GOOGLE_SATELLITE,
          mapLayerId: GoogleSatelliteLayerId,
        },
      ]}
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
