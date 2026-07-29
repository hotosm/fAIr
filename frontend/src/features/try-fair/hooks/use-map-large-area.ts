import { DrawingModes } from "@/enums";
import { useMapInstance } from "@/hooks/use-map-instance";
import { BBOX, Feature } from "@/types";
import {
  featureIsWithinBounds,
  getGeoJSONFeatureBounds,
  showErrorToast,
  showSuccessToast,
  showWarningToast,
  uuid4,
} from "@/utils";
import { GeoJSONStoreFeatures } from "terra-draw";
import { FeatureCollection, Polygon } from "geojson";
import { GeoJSONSource } from "maplibre-gl";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTryFairParams } from "@/features/try-fair/hooks/use-try-fair-params";
import {
  MapLargeAreaRequest,
  useSubmitMapLargeArea,
} from "@/features/try-fair/api/map-large-area";
import { useStartMappingStore } from "@/features/try-fair/utils/start-mapping-store";
import { TRY_FAIR_RESOLUTION_ZOOM } from "@/features/try-fair/utils/common";

export type AOITab = "whole" | "draw" | "upload";

const createFeatureFromBounds = (bounds: BBOX): Feature => {
  return {
    type: "Feature",
    id: uuid4(),
    properties: {
      mode: DrawingModes.POLYGON,
    },
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [bounds[0], bounds[1]],
          [bounds[2], bounds[1]],
          [bounds[2], bounds[3]],
          [bounds[0], bounds[3]],
          [bounds[0], bounds[1]],
        ],
      ],
    },
  };
};

interface UseMapLargeAreaOptions {
  imageryBounds?: BBOX | null;
  onSubmit: (aoi: Feature) => void;
  closeDialog: () => void;
}

export const useMapLargeArea = ({
  imageryBounds,
  onSubmit,
  closeDialog,
}: UseMapLargeAreaOptions) => {
  const { mapContainerRef, map, drawingMode, setDrawingMode, terraDraw } =
    useMapInstance(undefined, undefined, "red", imageryBounds ?? undefined);

  const { mutate: submitMapLargeArea, isPending: isSubmittingMapLargeArea } =
    useSubmitMapLargeArea();

  const { selectedImagery } = useStartMappingStore();
  const { modelId, selectedModel, inferenceParams, resolution, confidence } =
    useTryFairParams();
  const [activeTab, setActiveTab] = useState<AOITab>("draw");
  const [selectedAOI, setSelectedAOI] = useState<Feature | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const triggerFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  // Resize map & fit bounds initially
  useEffect(() => {
    if (!map || !imageryBounds) return;
    map.resize();
    map.fitBounds(
      [imageryBounds[0], imageryBounds[1], imageryBounds[2], imageryBounds[3]],
      {
        padding: 40,
        maxZoom: 18,
        essential: true,
      },
    );
  }, [map, imageryBounds]);

  // Render selected AOI directly on MapLibre style layer for guaranteed visual rendering
  useEffect(() => {
    if (!map) return;

    const SOURCE_ID = "large-area-aoi-source";
    const FILL_LAYER_ID = "large-area-aoi-fill";
    const OUTLINE_LAYER_ID = "large-area-aoi-outline";

    const updateMapLayer = () => {
      const geojsonData: FeatureCollection = selectedAOI
        ? {
            type: "FeatureCollection",
            features: [selectedAOI as unknown as Feature],
          }
        : { type: "FeatureCollection", features: [] };

      const source = map.getSource(SOURCE_ID) as GeoJSONSource | undefined;

      if (source) {
        source.setData(geojsonData);
      } else {
        try {
          map.addSource(SOURCE_ID, {
            type: "geojson",
            data: geojsonData,
          });

          if (!map.getLayer(FILL_LAYER_ID)) {
            map.addLayer({
              id: FILL_LAYER_ID,
              type: "fill",
              source: SOURCE_ID,
              paint: {
                "fill-color": "#D73434",
                "fill-opacity": 0.25,
              },
            });
          }

          if (!map.getLayer(OUTLINE_LAYER_ID)) {
            map.addLayer({
              id: OUTLINE_LAYER_ID,
              type: "line",
              source: SOURCE_ID,
              paint: {
                "line-color": "#D73434",
                "line-width": 3,
              },
            });
          }
        } catch {
          // Ignore source addition errors if map is unloading
        }
      }
    };

    if (map.isStyleLoaded()) {
      updateMapLayer();
    } else {
      map.once("styledata", updateMapLayer);
    }
  }, [map, selectedAOI]);

  const clearTerraDraw = useCallback(() => {
    if (terraDraw) {
      try {
        const snapshot = terraDraw.getSnapshot();
        if (snapshot && snapshot.length > 0) {
          const ids = snapshot
            .map((f) => f.id)
            .filter((id): id is string | number => id !== undefined);
          if (ids.length > 0) {
            terraDraw.removeFeatures(ids);
          }
        }
        terraDraw.clear();
      } catch (err) {
        console.error("Failed to clear TerraDraw:", err);
      }
    }
  }, [terraDraw]);

  // Handle Tab Switch
  const handleTabChange = useCallback(
    (tab: AOITab) => {
      setActiveTab(tab);
      setSelectedAOI(null);
      setUploadedFileName(null);
      setDrawingMode(DrawingModes.STATIC);
      clearTerraDraw();

      if (tab === "whole") {
        if (imageryBounds && imageryBounds.length === 4) {
          const wholeFeature = createFeatureFromBounds(imageryBounds);
          if (terraDraw) {
            terraDraw.addFeatures([wholeFeature] as GeoJSONStoreFeatures[]);
          }
          setSelectedAOI(wholeFeature);
          if (map) {
            map.fitBounds(
              [
                imageryBounds[0],
                imageryBounds[1],
                imageryBounds[2],
                imageryBounds[3],
              ],
              {
                padding: 40,
                maxZoom: 18,
                essential: true,
              },
            );
          }
        } else {
          showWarningToast("Imagery bounds are not available.");
        }
      } else if (tab === "draw") {
        setTimeout(() => {
          clearTerraDraw();
          setDrawingMode(DrawingModes.POLYGON);
        }, 50);
      } else if (tab === "upload") {
        triggerFileSelect();
      }
    },
    [clearTerraDraw, imageryBounds, map, setDrawingMode, terraDraw],
  );

  // Set default mode on initial mount if tab is draw
  useEffect(() => {
    if (activeTab === "draw") {
      setDrawingMode(DrawingModes.POLYGON);
    }
  }, [activeTab, setDrawingMode]);

  // TerraDraw finish listener
  const handleDrawFinish = useCallback(() => {
    if (!terraDraw) return;
    const snapshot = terraDraw.getSnapshot() as Feature[];
    if (!snapshot || snapshot.length === 0) return;

    const latestFeature = snapshot[snapshot.length - 1];

    if (imageryBounds && imageryBounds.length === 4) {
      if (!featureIsWithinBounds(imageryBounds, latestFeature)) {
        showWarningToast(
          "The drawn polygon extends beyond the imagery bounds. Please draw within the imagery bounds.",
        );
        terraDraw.clear();
        setSelectedAOI(null);
        setDrawingMode(DrawingModes.POLYGON);
        return;
      }
    }

    if (snapshot.length > 1) {
      terraDraw.removeFeatures(
        snapshot
          .slice(0, snapshot.length - 1)
          .map((f) => f.id)
          .filter((id): id is string | number => id !== undefined),
      );
    }

    setSelectedAOI(latestFeature);
    setDrawingMode(DrawingModes.STATIC);
  }, [terraDraw, imageryBounds, setDrawingMode]);

  useEffect(() => {
    if (!terraDraw) return;

    const onFinish = () => {
      handleDrawFinish();
    };

    terraDraw.on("finish", onFinish);

    return () => {
      terraDraw.off("finish", onFinish);
    };
  }, [terraDraw, handleDrawFinish]);

  // Handle uploaded GeoJSON file directly via native file picker
  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      let polygonGeometry: Polygon | null = null;
      let extractedFeature: Feature | null = null;

      if (parsed.type === "FeatureCollection") {
        const firstFeature = parsed.features?.find(
          (f: Feature) =>
            f.geometry?.type === "Polygon" ||
            f.geometry?.type === "MultiPolygon",
        );
        if (firstFeature) {
          extractedFeature = firstFeature;
          polygonGeometry = firstFeature.geometry as Polygon;
        }
      } else if (parsed.type === "Feature") {
        if (
          parsed.geometry?.type === "Polygon" ||
          parsed.geometry?.type === "MultiPolygon"
        ) {
          extractedFeature = parsed;
          polygonGeometry = parsed.geometry as Polygon;
        }
      } else if (parsed.type === "Polygon" || parsed.type === "MultiPolygon") {
        polygonGeometry = parsed as Polygon;
        extractedFeature = {
          type: "Feature",
          id: uuid4(),
          properties: { mode: DrawingModes.POLYGON },
          geometry: parsed,
        };
      }

      if (!polygonGeometry || !extractedFeature) {
        showErrorToast(
          undefined,
          `No valid Polygon feature found in ${file.name}.`,
        );
        return;
      }

      const uploadedFeature: Feature = {
        type: "Feature",
        id: extractedFeature.id || uuid4(),
        properties: {
          ...extractedFeature.properties,
          mode: DrawingModes.POLYGON,
        },
        geometry: polygonGeometry,
      };

      if (imageryBounds && imageryBounds.length === 4) {
        if (!featureIsWithinBounds(imageryBounds, uploadedFeature)) {
          showErrorToast(
            undefined,
            "The uploaded polygon is outside the imagery bounds. Please upload a polygon that lies within the imagery.",
          );
          return;
        }
      }

      if (terraDraw) {
        try {
          const snapshot = terraDraw.getSnapshot();
          if (snapshot && snapshot.length > 0) {
            const ids = snapshot
              .map((f) => f.id)
              .filter((id): id is string | number => id !== undefined);
            if (ids.length > 0) terraDraw.removeFeatures(ids);
          }
          terraDraw.clear();
        } catch {
          // ignore
        }
        terraDraw.addFeatures([uploadedFeature] as GeoJSONStoreFeatures[]);
      }

      setUploadedFileName(file.name);
      setSelectedAOI(uploadedFeature);
      setDrawingMode(DrawingModes.STATIC);

      if (map) {
        const bounds = getGeoJSONFeatureBounds(uploadedFeature);
        map.fitBounds(bounds, { padding: 40, maxZoom: 18, essential: true });
      }

      showSuccessToast(`Loaded area of interest from ${file.name}.`);
    } catch {
      showErrorToast(
        undefined,
        `Failed to parse ${file.name}. Please select a valid GeoJSON file.`,
      );
    }
  };

  const handleClearArea = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    clearTerraDraw();
    setSelectedAOI(null);
    setUploadedFileName(null);
    setDrawingMode(DrawingModes.STATIC);
    showSuccessToast("Selected area cleared.");
  };

  /**
   * Called by the floating draw button in the modal.
   * Clears any existing drawing and re-enables polygon drawing mode.
   */
  const handleEnableDrawing = useCallback(() => {
    clearTerraDraw();
    setSelectedAOI(null);
    setTimeout(() => {
      setDrawingMode(DrawingModes.POLYGON);
    }, 50);
  }, [clearTerraDraw, setDrawingMode]);

  const handleSubmit = () => {
    if (!selectedAOI) return;

    // Calculate BBOX array [minX, minY, maxX, maxY] from drawn or uploaded AOI
    const bbox = getGeoJSONFeatureBounds(selectedAOI);

    // Convert resolution to numeric zoom level
    const zoomNumber = TRY_FAIR_RESOLUTION_ZOOM[resolution] ?? 18;

    // Extra dynamic inference parameters from STAC
    const extraParams: Record<string, unknown> = {};
    if (inferenceParams && inferenceParams.length > 0) {
      inferenceParams.forEach((param) => {
        if (param.key !== "confidence_threshold") {
          extraParams[param.key] = param.value;
        }
      });
    }

    const payload: MapLargeAreaRequest = {
      model_stac_id: selectedModel?.id ?? modelId,
      image_uri: selectedImagery?.tileUrl ?? "",
      bbox,
      zoom: zoomNumber,
      params: {
        confidence_threshold: confidence,
        ...extraParams,
      },
    };

    onSubmit(selectedAOI);

    submitMapLargeArea(payload, {
      onSuccess: () => {
        showSuccessToast("Map large area request submitted successfully.");
        closeDialog();
      },
      onError: (err) => {
        showErrorToast(err, "Failed to submit map large area request.");
      },
    });
  };

  return {
    mapContainerRef,
    map,
    drawingMode,
    setDrawingMode,
    terraDraw,
    activeTab,
    selectedAOI,
    uploadedFileName,
    fileInputRef,
    isSubmittingMapLargeArea,
    handleTabChange,
    handleFileChange,
    handleClearArea,
    handleEnableDrawing,
    handleSubmit,
  };
};
