import { ImagerySource, ModelType, TileServiceType } from "@/enums";
import { BaseModelStacItem } from "@/features/try-fair/api/stac";
import { getImageryTileJSONUrl } from "@/features/try-fair/api/hot-imagery";
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
import { useEffect, useMemo } from "react";
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

  const preview = useMemo(
    () => selectedModel?.properties["fair:preview"],
    [selectedModel],
  );

  const tileServiceUrl = useMemo(() => {
    // On a shared-link refresh the store starts empty, so `selectedImagery`
    // isn't populated until the async item/selection resolves. Derive the URL
    // straight from the URL params meanwhile so the CORRECT imagery renders
    // immediately — otherwise the model's default imagery shows first and then
    // swaps (a visible flash of the wrong imagery + a white gap during the
    // layer swap). The same TileJSON URL is used when `selectedImagery` is set
    // (see the restore effect), so the source is added once and never swapped.
    const restoring = mode === ModelType.IMAGERY && !selectedImagery;
    const candidate = restoring
      ? oamItemId
        ? getImageryTileJSONUrl(oamItemId)
        : (imageryUrl ?? undefined)
      : currentModelType === ModelType.DEMO
        ? preview?.imagery.url
        : selectedImagery?.tileUrl;
    if (!candidate) return FALLBACK_FAIR_IMAGERY;
    const regex = getTileServerRegex(getTileServerTypeFromURL(candidate));
    return regex.test(candidate) ? candidate : FALLBACK_FAIR_IMAGERY;
  }, [
    currentModelType,
    selectedImagery,
    preview,
    mode,
    oamItemId,
    imageryUrl,
  ]);

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
      // Switch to imagery mode immediately so the tile URL is derived from the
      // item id right away (see tileServiceUrl) — don't wait for the STAC fetch,
      // which only adds bounds/metadata for the picker card and centering.
      setCurrentModelType(ModelType.IMAGERY);
      if (!sharedOAMItem) return;
      setSeletedImagery({
        source: ImagerySource.OPEN_AERIAL_MAP,
        item: sharedOAMItem,
        tileUrl: getImageryTileJSONUrl(
          sharedOAMItem.id,
          sharedOAMItem.assetName,
        ),
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
    if (preview?.center) return preview.center;

    return tileServiceUrl === FALLBACK_FAIR_IMAGERY
      ? FALLBACK_FAIR_IMAGERY_CENTER
      : DEFAULT_FAIR_IMAGERY_CENTER;
  }, [
    currentModelType,
    selectedImagery,
    preview,
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

  // Single, reliable camera move for the imagery. `map` here is only ever set
  // after MapLibre's `load` (see useMapInstance), so it's already loaded — the
  // previous `isStyleLoaded()` / `once("load")` guard could silently skip the
  // zoom (the one-shot `load` had already fired), which is why the map
  // sometimes stayed at world view, and Safari hit that window more often.
  // Fit the imagery's bounds when known, otherwise fly to its center.
  useEffect(() => {
    if (!map || isCustomTMSImagery) return;
    // Prefer fitting known bounds — this is what makes the zoom reliable and it
    // must not wait on `selectedModel` (on a shared-link refresh the imagery's
    // bounds resolve before/without a model), otherwise the map can stay at
    // world view. Fit instantly (duration: 0) so a refresh lands at the right
    // zoom without a mid-animation that could be interrupted; only fall back to
    // an animated flyTo (which needs a model's preview center) when there are
    // no bounds to fit.
    if (imageryBounds) {
      map.fitBounds(
        [imageryBounds[0], imageryBounds[1], imageryBounds[2], imageryBounds[3]],
        { padding: 40, duration: 0, essential: true },
      );
    } else if (selectedModel) {
      map.flyTo({
        center: imageryCenter,
        zoom: TRY_FAIR_INITIAL_MAP_ZOOM,
        essential: true,
      });
    }
  }, [imageryBounds, imageryCenter, isCustomTMSImagery, map, selectedModel]);

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
