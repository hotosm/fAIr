import { ImagerySource, ModelType, TileServiceType } from "@/enums";
import { BaseModelStacItem } from "@/features/try-fair/api/stac";
import { getImageryTileUrl } from "@/features/try-fair/api/hot-imagery";
import { useOAMItem } from "@/features/try-fair/hooks/use-oam-item";
import { useStartMappingStore } from "@/features/try-fair/utils/start-mapping-store";
import {
  DEFAULT_FAIR_IMAGERY_CENTER,
  FALLBACK_FAIR_IMAGERY,
  FALLBACK_FAIR_IMAGERY_CENTER,
  TRY_FAIR_INITIAL_MAP_ZOOM,
} from "@/features/try-fair/utils/common";
import { useTileservice } from "@/hooks/use-tileservice";
import { BBOX } from "@/types";
import { getTileServerRegex, getTileServerTypeFromURL } from "@/utils";
import { Map } from "maplibre-gl";
import { useEffect, useMemo, useRef } from "react";
import { useShallow } from "zustand/react/shallow";

type UseTryFairImageryOptions = {
  map: Map | null;
  selectedModel: BaseModelStacItem | null;
  mode: ModelType;
  imageryUrl: string | null;
  imageryTileServiceType: TileServiceType | null;
  oamItemId: string | null;
};

/**
 * Resolves the active imagery, restores it from shared URLs, and keeps the
 * map camera aligned to imagery that has known bounds.
 */
export const useTryFairImagery = ({
  map,
  selectedModel,
  mode,
  imageryUrl,
  imageryTileServiceType,
  oamItemId,
}: UseTryFairImageryOptions) => {
  const {
    currentModelType,
    setCurrentModelType,
    selectedImagery,
    setSeletedImagery,
  } = useStartMappingStore(
    useShallow((state) => ({
      currentModelType: state.currentModelType,
      setCurrentModelType: state.setCurrentModelType,
      selectedImagery: state.selectedImagery,
      setSeletedImagery: state.setSeletedImagery,
    })),
  );
  const { item: sharedOAMItem } = useOAMItem(oamItemId);

  const tileServiceUrl = useMemo(() => {
    const modelImagery =
      currentModelType === ModelType.DEMO
        ? selectedModel?.properties["fair:source_imagery"]
        : selectedImagery?.tileUrl;
    if (!modelImagery) return FALLBACK_FAIR_IMAGERY;
    const regex = getTileServerRegex(getTileServerTypeFromURL(modelImagery));
    return regex.test(modelImagery) ? modelImagery : FALLBACK_FAIR_IMAGERY;
  }, [currentModelType, selectedImagery, selectedModel]);

  const tileServiceType =
    currentModelType === ModelType.IMAGERY &&
    selectedImagery?.source === ImagerySource.CUSTOM
      ? selectedImagery.tileServiceType
      : (imageryTileServiceType ?? getTileServerTypeFromURL(tileServiceUrl));

  const {
    tileserverURL,
    setTileserverURL,
    setTileServiceType,
    loading: tileLoading,
    tileJSONMetadata,
    tileServiceTypeValidity,
  } = useTileservice(tileServiceType, tileServiceUrl);

  useEffect(() => {
    setTileserverURL(tileServiceUrl);
    setTileServiceType(tileServiceType);
  }, [setTileServiceType, setTileserverURL, tileServiceType, tileServiceUrl]);

  // Recreate selected imagery from a shared URL. OAM supplies its bounds and
  // compatible TileJSON sources supply their metadata after loading.
  useEffect(() => {
    if (mode === ModelType.DEMO) {
      setCurrentModelType(ModelType.DEMO);
      return;
    }

    if (oamItemId) {
      if (!sharedOAMItem) return;
      setCurrentModelType(ModelType.IMAGERY);
      setSeletedImagery({
        source: ImagerySource.OPEN_AERIAL_MAP,
        item: sharedOAMItem,
        tileUrl: getImageryTileUrl(sharedOAMItem.id, sharedOAMItem.assetName),
        bounds: sharedOAMItem.bbox,
      });
      return;
    }

    if (imageryUrl) {
      setCurrentModelType(ModelType.IMAGERY);
      setSeletedImagery({
        source: ImagerySource.CUSTOM,
        tileUrl: imageryUrl,
        tileServiceType:
          imageryTileServiceType ?? getTileServerTypeFromURL(imageryUrl),
        bounds: null,
      });
    }
  }, [
    imageryTileServiceType,
    imageryUrl,
    mode,
    oamItemId,
    setCurrentModelType,
    setSeletedImagery,
    sharedOAMItem,
  ]);

  const imageryCenter = useMemo((): [number, number] => {
    if (currentModelType === ModelType.IMAGERY && selectedImagery?.bounds) {
      const [w, s, e, n] = selectedImagery.bounds;
      return [(w + e) / 2, (s + n) / 2];
    }
    if (currentModelType === ModelType.IMAGERY && tileJSONMetadata?.center) {
      return [tileJSONMetadata.center[0], tileJSONMetadata.center[1]];
    }
    if (currentModelType === ModelType.IMAGERY && tileJSONMetadata?.bounds) {
      const [w, s, e, n] = tileJSONMetadata.bounds as BBOX;
      return [(w + e) / 2, (s + n) / 2];
    }
    const previewLocation = selectedModel?.properties["fair:preview_location"];
    if (previewLocation) return previewLocation.coordinates;

    return tileServiceUrl === FALLBACK_FAIR_IMAGERY
      ? FALLBACK_FAIR_IMAGERY_CENTER
      : DEFAULT_FAIR_IMAGERY_CENTER;
  }, [
    currentModelType,
    selectedImagery,
    selectedModel,
    tileJSONMetadata,
    tileServiceUrl,
  ]);

  // TMS templates do not provide a reliable imagery extent, so preserve the
  // user's current view both on selection and on a shared-link initial load.
  const isCustomTMSImagery =
    (currentModelType === ModelType.IMAGERY &&
      selectedImagery?.source === ImagerySource.CUSTOM &&
      selectedImagery.tileServiceType === TileServiceType.TMS) ||
    (mode === ModelType.IMAGERY &&
      Boolean(imageryUrl) &&
      imageryTileServiceType === TileServiceType.TMS);

  const imageryBounds = useMemo<BBOX | null>(() => {
    if (currentModelType === ModelType.IMAGERY && selectedImagery?.bounds) {
      return selectedImagery.bounds;
    }
    if (tileJSONMetadata?.bounds) return tileJSONMetadata.bounds as BBOX;
    return null;
  }, [currentModelType, selectedImagery, tileJSONMetadata]);

  const mapFlownRef = useRef(false);
  useEffect(() => {
    if (!map || !selectedModel || isCustomTMSImagery) return;

    const flyToImagery = () => {
      mapFlownRef.current = true;
      map.flyTo({
        center: imageryCenter,
        zoom: TRY_FAIR_INITIAL_MAP_ZOOM,
        essential: true,
      });
    };

    if (mapFlownRef.current || map.isStyleLoaded()) {
      flyToImagery();
    } else {
      map.once("load", flyToImagery);
      return () => {
        map.off("load", flyToImagery);
      };
    }
  }, [imageryCenter, isCustomTMSImagery, map, selectedModel]);

  useEffect(() => {
    if (!map || !imageryBounds || isCustomTMSImagery) return;
    map.fitBounds(
      [imageryBounds[0], imageryBounds[1], imageryBounds[2], imageryBounds[3]],
      { padding: 40, duration: 0, essential: true },
    );
  }, [imageryBounds, isCustomTMSImagery, map]);

  return {
    currentModelType,
    imageryBounds,
    imageryCenter: isCustomTMSImagery ? undefined : imageryCenter,
    selectedImagery,
    setCurrentModelType,
    setSeletedImagery,
    tileLoading,
    tileServiceTypeValidity,
    tileserverURL,
  };
};
