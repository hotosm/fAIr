import {
  MAP_LARGE_AREA_MAX_SIZE_SQKM,
  MAP_LARGE_AREA_MAX_SIZE_SQM,
  TMS_SOURCE_ID,
} from "@/config";
import { RasterTileSource } from "maplibre-gl";
import { DrawingModes, ModelType } from "@/enums";

import { useMapInstance } from "@/hooks/use-map-instance";
import { BBOX, Feature } from "@/types";
import {
  calculateGeoJSONArea,
  featureIsWithinBounds,
  formatAreaInAppropriateUnit,
  getGeoJSONFeatureBounds,
  showErrorToast,
  showSuccessToast,
  showWarningToast,
  uuid4,
} from "@/utils";
import { GeoJSONStoreFeatures } from "terra-draw";
import { FeatureCollection, Polygon } from "geojson";
import { GeoJSONSource } from "maplibre-gl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  isOpened: boolean;
  imageryBounds?: BBOX | null;
  /** Fully resolved tile URL from useTileservice – covers both demo and custom imagery. */
  tileServerURL?: string;
  onSubmit: () => void;
  closeDialog: () => void;
}

export const useMapLargeArea = ({
  isOpened,
  imageryBounds,
  tileServerURL,
  onSubmit,
  closeDialog,
}: UseMapLargeAreaOptions) => {
  const { selectedImagery, currentModelType } = useStartMappingStore();
  const activeImageryBounds = imageryBounds ?? selectedImagery?.bounds ?? null;
  // Pass no bounds so drawing isn't constrained to the imagery extent — the
  // user can click/draw anywhere on the map.
  const { mapContainerRef, map, drawingMode, setDrawingMode, terraDraw } =
    useMapInstance(undefined, undefined, "red", null, activeImageryBounds);

  // "Map Whole Area" is disabled when the imagery footprint alone already
  // exceeds the Map Large Area limit — in that case only a drawn/uploaded
  // sub-area can be requested.
  const isWholeAreaDisabled = useMemo(() => {
    if (!activeImageryBounds || activeImageryBounds.length !== 4) return false;
    const imageryArea = calculateGeoJSONArea(
      createFeatureFromBounds(activeImageryBounds),
    );
    return imageryArea > MAP_LARGE_AREA_MAX_SIZE_SQM;
  }, [activeImageryBounds]);

  const { mutate: submitMapLargeArea, isPending: isSubmittingMapLargeArea } =
    useSubmitMapLargeArea();

  const { modelId, selectedModel, inferenceParams, resolution, confidence } =
    useTryFairParams();
  const [activeTab, setActiveTab] = useState<AOITab>("draw");
  const [selectedAOI, setSelectedAOI] = useState<Feature | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [description, setDescription] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const triggerFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const frameImagery = useCallback(() => {
    if (!isOpened || !map || !activeImageryBounds) return;
    map.resize();
    const frame: [number, number, number, number] = [
      activeImageryBounds[0],
      activeImageryBounds[1],
      activeImageryBounds[2],
      activeImageryBounds[3],
    ];
    map.fitBounds(frame, { padding: 40, maxZoom: 18, duration: 0 });
  }, [isOpened, map, activeImageryBounds]);

  useEffect(() => {
    if (!isOpened || !map) return;
    frameImagery();

    // Cap the map's minimum zoom at the imagery's own minzoom so users can't zoom
    // out past where the bounded raster has tiles — below it the imagery simply
    // disappears (large coastal scenes otherwise fit below it and show empty).
    // setMinZoom also lifts the current view up if the fit landed below it. The
    // AOI (including "whole imagery") comes from bounds, not the view, so this
    // only affects what the user sees. minzoom is known once the TileJSON loads.
    let applied = false;
    const lockMinZoom = (event: {
      sourceId?: string;
      isSourceLoaded?: boolean;
    }) => {
      if (applied || event.sourceId !== TMS_SOURCE_ID || !event.isSourceLoaded)
        return;
      const source = map.getSource(TMS_SOURCE_ID) as
        | RasterTileSource
        | undefined;
      if (typeof source?.minzoom !== "number") return;
      applied = true;
      map.setMinZoom(source.minzoom);
      frameImagery();
    };
    map.on("sourcedata", lockMinZoom);
    // On reopening, cached imagery may already be loaded and emit no new event.
    if (map.getSource(TMS_SOURCE_ID)) {
      lockMinZoom({
        sourceId: TMS_SOURCE_ID,
        isSourceLoaded: map.isSourceLoaded(TMS_SOURCE_ID),
      });
    }
    return () => {
      map.off("sourcedata", lockMinZoom);
      if (map.getStyle()) map.setMinZoom(undefined);
    };
  }, [map, isOpened, frameImagery, tileServerURL]);

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

    // Existing GeoJSON sources can be updated while raster tiles are loading.
    // Waiting for styledata here can leave the old AOI on the retained map.
    if (map.getSource(SOURCE_ID) || map.isStyleLoaded()) {
      updateMapLayer();
    } else {
      map.once("styledata", updateMapLayer);
    }
    return () => {
      map.off("styledata", updateMapLayer);
    };
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

  // Retain the map and its tiles, but start each request with a fresh form.
  useEffect(() => {
    if (isOpened) return;
    clearTerraDraw();
    setActiveTab("draw");
    setSelectedAOI(null);
    setUploadedFileName(null);
    setDescription("");
    setDrawingMode(DrawingModes.STATIC);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [isOpened, clearTerraDraw, setDrawingMode]);

  // Handle Tab Switch
  const handleTabChange = useCallback(
    (tab: AOITab) => {
      // "Map Whole Area" is unavailable when the imagery exceeds the limit.
      if (tab === "whole" && isWholeAreaDisabled) return;
      // For upload tab, open the file picker immediately (within the user
      // gesture) so the browser doesn't block it. Cleanup runs after.
      if (tab === "upload") {
        triggerFileSelect();
      }

      setActiveTab(tab);
      setSelectedAOI(null);
      setUploadedFileName(null);
      setDrawingMode(DrawingModes.STATIC);
      clearTerraDraw();

      if (tab === "whole") {
        if (activeImageryBounds && activeImageryBounds.length === 4) {
          const wholeFeature = createFeatureFromBounds(activeImageryBounds);
          if (terraDraw) {
            terraDraw.addFeatures([wholeFeature] as GeoJSONStoreFeatures[]);
          }
          setSelectedAOI(wholeFeature);
          if (map) {
            map.fitBounds(
              [
                activeImageryBounds[0],
                activeImageryBounds[1],
                activeImageryBounds[2],
                activeImageryBounds[3],
              ],
              {
                padding: 40,
                maxZoom: 18,
                essential: true,
              },
            );
          }
        }
      } else if (tab === "draw") {
        setDrawingMode(DrawingModes.POLYGON);
      }
    },
    [
      activeImageryBounds,
      clearTerraDraw,
      map,
      setDrawingMode,
      terraDraw,
      isWholeAreaDisabled,
    ],
  );

  // Resume drawing only while the modal is open.
  useEffect(() => {
    if (isOpened && activeTab === "draw") {
      setDrawingMode(DrawingModes.POLYGON);
    }
  }, [isOpened, activeTab, setDrawingMode]);

  // TileJSON bounds can arrive after the user selects the whole-imagery tab.
  // Create the AOI once those bounds become available.
  useEffect(() => {
    if (
      !isOpened ||
      activeTab !== "whole" ||
      !activeImageryBounds ||
      selectedAOI
    )
      return;

    const wholeFeature = createFeatureFromBounds(activeImageryBounds);
    if (terraDraw) {
      terraDraw.addFeatures([wholeFeature] as GeoJSONStoreFeatures[]);
    }
    setSelectedAOI(wholeFeature);
  }, [isOpened, activeImageryBounds, activeTab, selectedAOI, terraDraw]);

  // TerraDraw finish listener
  const handleDrawFinish = useCallback(() => {
    if (!terraDraw) return;
    const snapshot = terraDraw.getSnapshot() as Feature[];
    if (!snapshot || snapshot.length === 0) return;

    const latestFeature = snapshot[snapshot.length - 1];

    // Only a maximum limit applies to a Map Large Area request — there is no
    // minimum, and the area may extend beyond the imagery bounds.
    const drawnArea = calculateGeoJSONArea(latestFeature);
    if (drawnArea > MAP_LARGE_AREA_MAX_SIZE_SQM) {
      showWarningToast(
        `The selected area (${formatAreaInAppropriateUnit(
          drawnArea,
        )}) is larger than the ${MAP_LARGE_AREA_MAX_SIZE_SQKM.toLocaleString()} km² limit. Please draw a smaller area.`,
      );
      terraDraw.clear();
      setSelectedAOI(null);
      setDrawingMode(DrawingModes.POLYGON);
      return;
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
  }, [activeImageryBounds, terraDraw, setDrawingMode]);

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

  // Escape should stop an active drawing rather than bubble up and close the
  // modal. Intercept it in the capture phase while drawing is in progress.
  useEffect(() => {
    if (!isOpened) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (drawingMode !== DrawingModes.POLYGON) return;
      event.preventDefault();
      event.stopPropagation();
      clearTerraDraw();
      setSelectedAOI(null);
      setDrawingMode(DrawingModes.STATIC);
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [isOpened, drawingMode, clearTerraDraw, setDrawingMode]);

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

      if (activeImageryBounds && activeImageryBounds.length === 4) {
        if (!featureIsWithinBounds(activeImageryBounds, uploadedFeature)) {
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
  };

  /**
   * Called by the floating draw button in the modal.
   * Clears any existing drawing and re-enables polygon drawing mode.
   */
  const handleEnableDrawing = useCallback(() => {
    clearTerraDraw();
    setSelectedAOI(null);
    setDrawingMode(DrawingModes.POLYGON);
  }, [clearTerraDraw, setDrawingMode]);

  const handleSubmit = () => {
    if (!selectedAOI || !description.trim()) return;

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
      image_uri:
        currentModelType === ModelType.DEMO
          ? (tileServerURL ?? "")
          : (selectedImagery?.tileUrl ?? ""),
      zoom: zoomNumber,
      description: description,
      params: {
        confidence_threshold: confidence,
        ...extraParams,
      },
      ...(activeTab === "whole"
        ? { bbox: getGeoJSONFeatureBounds(selectedAOI) }
        : { geometry: selectedAOI.geometry }),
    };

    submitMapLargeArea(payload, {
      onSuccess: () => {
        showSuccessToast("Map large area request submitted successfully.");
        onSubmit();
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
    description,
    setDescription,
    handleTabChange,
    handleFileChange,
    handleClearArea,
    handleEnableDrawing,
    handleSubmit,
    isWholeAreaDisabled,
    frameImagery,
  };
};
