import { TileServiceType } from "@/enums";
import { getTMSTileJSON } from "@/features/model-creation/api/get-tms-tilejson";
import { TileJSON } from "@/types";
import {
  extractTileJSONURL,
  getTileServerRegex,
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
