import { ImagerySource, ModelType, TileServiceType } from "@/enums";
import { BaseModelStacItem } from "@/features/try-fair/api/stac";
import {
  getImageryTileJSONUrl,
  getImageryTileUrl,
} from "@/features/try-fair/api/hot-imagery";
import { useOAMItem } from "@/features/try-fair/hooks/use-oam-item";
import { useStartMappingStore } from "@/features/try-fair/utils/start-mapping-store";
import {
  DEFAULT_FAIR_IMAGERY_CENTER,
  FALLBACK_FAIR_IMAGERY,
  FALLBACK_FAIR_IMAGERY_CENTER,
} from "@/features/try-fair/utils/common";
import { useTileservice } from "@/hooks/use-tileservice";
import { BBOX } from "@/types";
import { getTileServerRegex, getTileServerTypeFromURL } from "@/utils";
import { useEffect, useMemo } from "react";
import { useShallow } from "zustand/react/shallow";

type UseTryFairImageryOptions = {
  selectedModel: BaseModelStacItem | null;
  mode: ModelType;
  imageryUrl: string | null;
  imageryTileServiceType: TileServiceType | null;
  oamItemId: string | null;
};

/**
 * Resolves the active imagery and restores it from shared URLs. It exposes the
 * imagery's center/bounds and the URLs for map display and prediction, but it
 * does NOT move the camera — the map fits to the tile grid (the AOI) in
 * try-fair-map, which is the single owner of camera moves. Keeping camera
 * control in one place is what makes the zoom-to-grid behaviour stable; a
 * second controller here used to race it (sometimes fitting the whole image,
 * sometimes nothing).
 */
export const useTryFairImagery = ({
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

  // URL handed to the prediction backend, which downloads raster "chips" from
  // it — so it MUST be an XYZ `{z}/{x}/{y}` tile template, not a tilejson.json
  // URL. `tileserverURL` for OAM is the tilejson URL (used for map display, so
  // MapLibre can read the bounds); passing that to the backend makes it save
  // the JSON document as a `.tif`, which GDAL rejects ("not recognized as being
  // in a supported file format"). OAM's own frontend uses the same split:
  // `{z}/{x}/{y}` for tiles, tilejson.json only for bounds.
  const predictionImageUri = useMemo(() => {
    if (
      currentModelType === ModelType.IMAGERY &&
      selectedImagery?.source === ImagerySource.OPEN_AERIAL_MAP
    ) {
      return getImageryTileUrl(
        selectedImagery.item.id,
        selectedImagery.item.assetName,
      );
    }
    // Shared-link restore before `selectedImagery` has resolved.
    if (mode === ModelType.IMAGERY && !selectedImagery && oamItemId) {
      return getImageryTileUrl(oamItemId);
    }
    // A TileJSON source advertises its real tile template under `tiles`; prefer
    // that over the tilejson URL itself so the backend still gets {z}/{x}/{y}.
    if (
      getTileServerTypeFromURL(tileserverURL) === TileServiceType.TILEJSON &&
      tileJSONMetadata?.tiles?.[0]
    ) {
      return tileJSONMetadata.tiles[0];
    }
    return tileserverURL;
  }, [
    currentModelType,
    selectedImagery,
    mode,
    oamItemId,
    tileserverURL,
    tileJSONMetadata,
  ]);

  return {
    currentModelType,
    imageryBounds,
    imageryCenter: isCustomTMSImagery ? undefined : imageryCenter,
    predictionImageUri,
    selectedImagery,
    setCurrentModelType,
    setSeletedImagery,
    tileLoading,
    tileServiceTypeValidity,
    tileserverURL,
  };
};
