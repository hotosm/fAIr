import { useMap } from "@/app/providers/map-provider";
import { MapComponent, MapCursorToolTip } from "@/components/map";
import { GeoJSONType, PaginatedTrainingArea } from "@/types";
import { GeoJSONSource, GeoJSONSourceSpecification } from "maplibre-gl";
import { useCallback, useEffect, useState } from "react";
import {
  useCreateTrainingArea,
  useGetTrainingDatasetLabels,
} from "@/features/model-creation/hooks/use-training-areas";
import { geojsonToWKT } from "@terraformer/wkt";
import { useToastNotification } from "@/hooks/use-toast-notification";
import {
  calculateGeoJSONArea,
  formatAreaInAppropriateUnit,
  getTileBoundariesGeoJSON,
  MAX_TRAINING_AREA_SIZE,
  MIN_TRAINING_AREA_SIZE,
  snapGeoJSONGeometryToClosestTile,
  TRAINING_AREAS_AOI_FILL_COLOR,
  TRAINING_AREAS_AOI_FILL_OPACITY,
  TRAINING_AREAS_AOI_LABELS_FILL_COLOR,
  TRAINING_AREAS_AOI_LABELS_FILL_OPACITY,
  TRAINING_AREAS_AOI_LABELS_OUTLINE_COLOR,
  TRAINING_AREAS_AOI_LABELS_OUTLINE_WIDTH,
  TRAINING_AREAS_AOI_OUTLINE_COLOR,
  TRAINING_AREAS_AOI_OUTLINE_WIDTH,
  TRAINING_LABELS_MIN_ZOOM_LEVEL,
  validateGeoJSONArea,
} from "@/utils";
import useDebounce from "@/hooks/use-debounce";
import { BASEMAPS, DrawingModes } from "@/enums";
import { useToolTipVisibility } from "@/hooks/use-tooltip-visibility";

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
  const { map, terraDraw, drawingMode, setDrawingMode } = useMap();
  const toast = useToastNotification();
  const OSMBasemapLayerId = "osm-layer";
  const GoogleSatelliteLayerId = "google-statellite-layer";
  const GoogleSatelliteSourceId = "google-satellite";
  const TMSLayerId = `training-dataset-tms-layer`;
  const TMSSourceId = `oam-training-dataset-${trainingDatasetId}`;
  const trainingAreasLayerId = `dataset-${trainingDatasetId}-training-area-layer`;
  const trainingAreasFillLayerId = `dataset-${trainingDatasetId}-training-area-fill-layer`;
  const trainingDatasetLabelsSourceId = `dataset-${trainingDatasetId}-training-labels-source`;
  const trainingAreasSourceId = `dataset-${trainingDatasetId}-training-area-source`;
  const trainingDatasetLabelsLayerId = `dataset-${trainingDatasetId}-training-labels-fill-layer`;
  const trainingDatasetLabelsOutlineLayerId = `dataset-${trainingDatasetId}-training-labels-outline-layer`;
  const tileBoundarylayerId = "tile-boundary-layer";
  const tileBoundarySourceId = "tile-boundaries";
  const [currentZoom, setCurrentZoom] = useState<number>(0);
  const [bbox, setBbox] = useState("");

  const [featureArea, setFeatureArea] = useState<number>(0);

  const { setTooltipVisible, tooltipPosition, tooltipVisible } = useToolTipVisibility([
    drawingMode,
    currentZoom,
  ]);

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
        tileSize: 256,
      });
    }

    if (!map.getSource(TMSSourceId)) {
      map.addSource(TMSSourceId, {
        type: "raster",
        url: tileJSONURL,
        tileSize: 256,
      });
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
        // @ts-expect-error bad type definition
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
    if (data?.results && !map.getLayer(trainingAreasFillLayerId)) {
      map.addLayer({
        id: trainingAreasFillLayerId,
        type: "fill",
        source: trainingAreasSourceId,
        paint: {
          "fill-color": TRAINING_AREAS_AOI_FILL_COLOR,
          "fill-opacity": TRAINING_AREAS_AOI_FILL_OPACITY,
        },
        layout: { visibility: "visible" },
      });
    }
    if (data?.results && !map.getLayer(trainingAreasLayerId)) {
      map.addLayer({
        id: trainingAreasLayerId,
        type: "line",
        source: trainingAreasSourceId,
        paint: {
          "line-color": TRAINING_AREAS_AOI_OUTLINE_COLOR,
          "line-width": TRAINING_AREAS_AOI_OUTLINE_WIDTH,
        },
        layout: { visibility: "visible" },
      });
    }

    if (!map.getLayer(trainingDatasetLabelsLayerId)) {
      map.addLayer({
        id: trainingDatasetLabelsLayerId,
        type: "fill",
        source: trainingDatasetLabelsSourceId,
        paint: {
          "fill-color": TRAINING_AREAS_AOI_LABELS_FILL_COLOR,
          "fill-opacity": TRAINING_AREAS_AOI_LABELS_FILL_OPACITY,
        },
        minzoom: TRAINING_LABELS_MIN_ZOOM_LEVEL,
        layout: { visibility: "visible" },
      });
    }
    if (!map.getLayer(trainingDatasetLabelsOutlineLayerId)) {
      map.addLayer({
        id: trainingDatasetLabelsOutlineLayerId,
        type: "line",
        source: trainingDatasetLabelsSourceId,
        paint: {
          "line-color": TRAINING_AREAS_AOI_LABELS_OUTLINE_COLOR,
          "line-width": TRAINING_AREAS_AOI_LABELS_OUTLINE_WIDTH,
        },
        minzoom: TRAINING_LABELS_MIN_ZOOM_LEVEL,
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
        const source = map.getSource(
          trainingDatasetLabelsSourceId,
        ) as GeoJSONSource;
        source?.setData(labels as GeoJSONType);
      }
    }
  }, [map, labels]);

  const updateTrainingArea = useCallback(() => {
    if (map) {
      if (map.getSource(trainingAreasSourceId) && data?.results) {
        const source = map.getSource(trainingAreasSourceId) as GeoJSONSource;
        source.setData(data.results as GeoJSONType);
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
        const source = map.getSource(tileBoundarySourceId) as GeoJSONSource;
        source.setData(tileBoundaries as GeoJSONType);
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

  // drawing events and tooltip
  useEffect(() => {
    if (!terraDraw || !map) return;

    const handleFeatureChange = () => {
      const snapshot = terraDraw.getSnapshot();
      const area = calculateGeoJSONArea(snapshot[snapshot.length - 1]);
      setFeatureArea(area);
    };
    const handleFinish = async () => {
      const snapshot = terraDraw.getSnapshot();
      setFeatureArea(0);
      setDrawingMode(DrawingModes.STATIC);
      setTooltipVisible(false);
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

    terraDraw.on("change", handleFeatureChange);
    terraDraw.on("finish", handleFinish);
    return () => {
      terraDraw.off("change", handleFeatureChange);
      terraDraw.off("finish", handleFinish);
    };
  }, [terraDraw, drawingMode, setDrawingMode]);

  const showLabelsToolTip = currentZoom >= 14 && currentZoom < 18;

  const showTooltip = Boolean(
    drawingMode === DrawingModes.RECTANGLE || showLabelsToolTip,
  ) && tooltipVisible;

  const getTooltipColor = () => {
    if (featureArea !== 0) {
      if (
        featureArea < MIN_TRAINING_AREA_SIZE ||
        featureArea > MAX_TRAINING_AREA_SIZE
      )
        return "bg-primary";
    }
    return "bg-black";
  };

  const getFeedbackMessage = () => {
    if (featureArea !== 0) {
      if (featureArea < MIN_TRAINING_AREA_SIZE)
        return "Area too small. Expand to meet minimum size requirement.";
      if (featureArea > MAX_TRAINING_AREA_SIZE)
        return "Area too large. Reduce to meet maximum size requirement.";
      if (
        featureArea < MIN_TRAINING_AREA_SIZE * 1.2 ||
        featureArea > MAX_TRAINING_AREA_SIZE * 0.8
      ) {
        return "Area is close to size limits. Adjust if needed before completing.";
      }
      return "Area within acceptable range. Release mouse to finish drawing.";
    } else if (showLabelsToolTip) {
      return "Zoom in up to zoom 18 to see the fetched labels.";
    }
    return;
  };

  return (
    <MapComponent
      controlsLocation="top-left"
      drawControl
      showCurrentZoom
      layerControl
      layerControlBasemaps={[
        { value: BASEMAPS.OSM, subLayer: OSMBasemapLayerId },
        {
          value: BASEMAPS.GOOGLE_SATELLITE,
          subLayer: GoogleSatelliteLayerId,
        },
      ]}
      layerControlLayers={[
        { value: "TMS Layer", subLayers: [TMSLayerId] },
        ...(data?.results?.features?.length
          ? [
            {
              value: "Training Areas",
              subLayers: [trainingAreasLayerId, trainingAreasFillLayerId],
            },
          ]
          : []),
        ...(labels && labels?.features.length > 0
          ? [
            {
              value: "Training Labels",
              subLayers: [
                trainingDatasetLabelsLayerId,
                trainingDatasetLabelsOutlineLayerId,
              ],
            },
          ]
          : []),
      ]}
    >
      <MapCursorToolTip
        tooltipVisible={showTooltip}
        color={getTooltipColor()}
        map={map}
        tooltipPosition={tooltipPosition}
      >
        {!showLabelsToolTip && (
          <p>
            {drawingMode === DrawingModes.RECTANGLE && featureArea === 0
              ? "Click and drag to draw a rectangle."
              : `Current area: ${formatAreaInAppropriateUnit(featureArea)}`}
          </p>
        )}
        <p>{getFeedbackMessage()}</p>
      </MapCursorToolTip>
    </MapComponent>
  );
};

export default TrainingAreaMap;
