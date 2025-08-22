import { TMS_LAYER_ID, TMS_SOURCE_ID } from "@/config";
import { TileServiceType } from "@/enums";
import { getTMSTileJSON } from "@/features/model-creation/api/get-tms-tilejson";
import { MapInstance, TileJSON } from "@/types";
import {
  extractTileJSONURL,
  getTileServerRegex,
  getTileServerTypeFromURL,
  OPENAERIALMAP_TILESERVER_URL_REGEX_PATTERN,
  showErrorToast,
} from "@/utils";
import { useEffect, useMemo, useState } from "react";

export const useTileservice = (
  defaultTileServiceType: TileServiceType,
  defaultTileserverURL: string,
) => {
  const [tileServiceType, setTileServiceType] = useState<TileServiceType>(
    defaultTileServiceType,
  );

  const [loading, setLoading] = useState<boolean>(false);

  const [tileJSONMetadata, setTileJSONMetadata] = useState<TileJSON | null>(
    null,
  );

  const [tileserverURL, setTileserverURL] =
    useState<string>(defaultTileserverURL);

  const [tileServiceTypeValidity, setTileServiceTypeValidity] = useState({
    valid: false,
    message: "",
  });

  const currentRegex = useMemo(
    () => getTileServerRegex(tileServiceType),
    [tileServiceType],
  );
  const isValidTileserverURL = useMemo(
    () => currentRegex.test(tileserverURL),
    [tileserverURL, currentRegex],
  );

  /**
   * Set the validity of the tile service type and dataset name on component mount.
   */
  useEffect(() => {
    setTileServiceTypeValidity({
      valid: isValidTileserverURL,
      message: isValidTileserverURL
        ? ""
        : "Invalid tile server URL. Please provide a valid URL.",
    });
  }, [tileserverURL, tileServiceType]);

  const { sourceURL, isOpenAerialMap } = useMemo(() => {
    const openAerial =
      OPENAERIALMAP_TILESERVER_URL_REGEX_PATTERN.test(tileserverURL);
    return {
      isOpenAerialMap: openAerial,
      sourceURL: openAerial ? extractTileJSONURL(tileserverURL) : tileserverURL,
    };
  }, [tileserverURL]);

  useEffect(() => {
    setTileJSONMetadata(null);
  }, [tileserverURL, tileServiceType]);

  useEffect(() => {
    const shouldFetchBounds =
      (tileServiceType === TileServiceType.TILEJSON || isOpenAerialMap) &&
      tileServiceTypeValidity.valid &&
      sourceURL;

    if (!shouldFetchBounds) return;

    const fetchTileJSONMetadata = async () => {
      try {
        setLoading(true);
        const tileJSON = await getTMSTileJSON(
          isOpenAerialMap ? extractTileJSONURL(tileserverURL) : tileserverURL,
        );
        if (tileJSON?.bounds) {
          setTileJSONMetadata(tileJSON);
        }
      } catch (e) {
        showErrorToast(undefined, "Failed to fetch TileJSON metadata.");
      } finally {
        setLoading(false);
      }
    };

    fetchTileJSONMetadata();
  }, [
    tileServiceType,
    tileServiceTypeValidity.valid,
    sourceURL,
    isOpenAerialMap,
  ]);

  return {
    tileserverURL,
    setTileserverURL,
    tileServiceType,
    setTileServiceType,
    tileJSONMetadata,
    setTileJSONMetadata,
    tileServiceTypeValidity,
    setTileServiceTypeValidity,
    sourceURL,
    isOpenAerialMap,
    loading,
    setLoading,
  };
};

export const useTileServiceLayer = ({
  map,
  tileServiceURL,
  addLayerToMap = false,
}: {
  map: MapInstance;
  tileServiceURL: string;
  addLayerToMap?: boolean;
}) => {
  const [error, setError] = useState<string>("");

  const {
    tileServiceType,
    tileJSONMetadata,
    tileServiceTypeValidity,
    isOpenAerialMap,
    sourceURL,
    loading,
    setLoading,
  } = useTileservice(getTileServerTypeFromURL(tileServiceURL), tileServiceURL);

  useEffect(() => {
    if (!tileServiceTypeValidity.valid || !map || !sourceURL || !addLayerToMap)
      return;

    const source = map.getSource(TMS_SOURCE_ID);

    if (source) {
      map.removeLayer(TMS_LAYER_ID);
      map.removeSource(TMS_SOURCE_ID);
    }

    setError("");
    setLoading(true);
    try {
      if (isOpenAerialMap || tileServiceType === TileServiceType.TILEJSON) {
        map.addSource(TMS_SOURCE_ID, {
          type: "raster",
          url: sourceURL,
          tileSize: 256,
        });
      } else {
        map.addSource(TMS_SOURCE_ID, {
          type: "raster",
          tiles: [sourceURL],
          tileSize: 256,
        });
      }

      map.addLayer({
        id: TMS_LAYER_ID,
        type: "raster",
        source: TMS_SOURCE_ID,
        layout: { visibility: "visible" },
      });
    } catch (e) {
      setError(
        "Unable to load the tile server. Please verify the URL and try again.",
      );
    } finally {
      setLoading(false);
    }

    return () => {
      if (!map || !map?.getStyle()) return;
      if (map.getLayer(TMS_LAYER_ID)) map.removeLayer(TMS_LAYER_ID);
      if (map.getSource(TMS_SOURCE_ID)) map.removeSource(TMS_SOURCE_ID);
    };
  }, [
    map,
    sourceURL,
    tileServiceType,
    tileServiceTypeValidity.valid,
    isOpenAerialMap,
  ]);

  useEffect(() => {
    if (error) {
      showErrorToast(undefined, error);
    }
  }, [error]);

  const fitToBounds = () => {
    if (!map) return;
    map?.resize();
    if (!tileJSONMetadata?.bounds) return;
    map.fitBounds(tileJSONMetadata.bounds);
  };

  useEffect(() => {
    fitToBounds();
  }, [map, tileJSONMetadata]);

  const hasBounds = useMemo(() => {
    if (!tileJSONMetadata?.bounds) return false;
    const bounds = tileJSONMetadata.bounds;

    if (Array.isArray(bounds) && bounds.length === 4) {
      return true;
    }
    return false;
  }, [tileJSONMetadata]);

  return {
    loading,
    isOpenAerialMap,
    tileJSONMetadata,
    hasBounds,
    fitToBounds,
    error,
  };
};
