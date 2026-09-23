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
import { RasterTileSource } from "maplibre-gl";
import { useEffect, useMemo, useRef, useState } from "react";

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
  onFitToBounds,
}: {
  map: MapInstance;
  tileServiceURL: string;
  addLayerToMap?: boolean;
  /** Override the default fitBounds-to-imagery behavior when tileJSON loads. */
  onFitToBounds?: () => void;
}) => {
  const [error, setError] = useState<string>("");
  // Remembers how the current source was created ("url" for TileJSON/OAM,
  // "tiles" for XYZ/TMS) so we know whether we can update it in place.
  const sourceModeRef = useRef<"url" | "tiles" | null>(null);

  const {
    tileServiceType,
    tileJSONMetadata,
    tileServiceTypeValidity,
    isOpenAerialMap,
    sourceURL,
    loading,
    setLoading,
    setTileserverURL,
    setTileServiceType,
  } = useTileservice(getTileServerTypeFromURL(tileServiceURL), tileServiceURL);

  // Sync internal state when the URL prop changes (e.g. user switches model).
  // The type MUST be re-derived here too: without it `tileServiceType` keeps its
  // initial value, so switching from an XYZ imagery to a TileJSON one (or vice
  // versa) picks the wrong add branch — e.g. a tilejson.json URL gets dropped
  // into a `tiles:[...]` source and is requested as if it were a tile template,
  // leaving the map blank until a full refresh (which re-derives the type).
  useEffect(() => {
    setTileserverURL(tileServiceURL);
    setTileServiceType(getTileServerTypeFromURL(tileServiceURL));
  }, [tileServiceURL]);

  useEffect(() => {
    if (
      !tileServiceTypeValidity.valid ||
      !map ||
      !sourceURL ||
      !addLayerToMap ||
      !map.getStyle()
    )
      return;

    const useUrl =
      isOpenAerialMap || tileServiceType === TileServiceType.TILEJSON;
    const mode: "url" | "tiles" = useUrl ? "url" : "tiles";
    const existingSource = map.getSource(TMS_SOURCE_ID) as
      | RasterTileSource
      | undefined;

    setError("");
    setLoading(true);
    try {
      if (
        existingSource &&
        map.getLayer(TMS_LAYER_ID) &&
        sourceModeRef.current === mode
      ) {
        // Update the existing source in place. Removing and re-adding a raster
        // source under the same id intermittently leaves the map blank until a
        // full refresh (a known MapLibre behavior). setUrl/setTiles swap the
        // tiles and re-render cleanly without a teardown.
        if (useUrl) {
          existingSource.setUrl(sourceURL);
        } else {
          existingSource.setTiles([sourceURL]);
        }
      } else {
        // First add, or the source type changed (TileJSON <-> XYZ): (re)create.
        if (map.getLayer(TMS_LAYER_ID)) map.removeLayer(TMS_LAYER_ID);
        if (map.getSource(TMS_SOURCE_ID)) map.removeSource(TMS_SOURCE_ID);

        if (useUrl) {
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
        sourceModeRef.current = mode;
      }
    } catch (e) {
      setLoading(false);
      setError(
        "Unable to load the tile server. Please verify the URL and try again.",
      );
    }

    // Safety net: never let the loading spinner hang if the tile load never
    // reports completion (e.g. all tiles error silently). This cleanup runs on
    // every URL change but does NOT remove the source — that would force the
    // remove/re-add path we are specifically avoiding.
    const loadingTimeout = window.setTimeout(() => setLoading(false), 20000);
    return () => window.clearTimeout(loadingTimeout);
  }, [
    map,
    sourceURL,
    tileServiceType,
    tileServiceTypeValidity.valid,
    isOpenAerialMap,
    addLayerToMap,
    setLoading,
  ]);

  // Tear the layer/source down only when the map goes away or this consumer
  // unmounts — not on every imagery change (the effect above updates in place).
  useEffect(() => {
    if (!map) return;
    return () => {
      if (!map.getStyle()) return;
      if (map.getLayer(TMS_LAYER_ID)) map.removeLayer(TMS_LAYER_ID);
      if (map.getSource(TMS_SOURCE_ID)) map.removeSource(TMS_SOURCE_ID);
      sourceModeRef.current = null;
    };
  }, [map]);

  // Reflect the *actual* tile fetch in `loading`. `addSource` returns
  // immediately, long before tiles are on screen, so we watch the source's
  // load events and only clear loading once the raster source has loaded (or
  // errored). This is what a spinner should track — not just "source added".
  useEffect(() => {
    if (!map) return;

    const clearWhenLoaded = (event: {
      sourceId?: string;
      isSourceLoaded?: boolean;
    }) => {
      if (event.sourceId !== TMS_SOURCE_ID) return;
      if (event.isSourceLoaded && map.getSource(TMS_SOURCE_ID)) {
        setLoading(false);
      }
    };

    const clearOnError = (event: { sourceId?: string }) => {
      if (event.sourceId === TMS_SOURCE_ID) setLoading(false);
    };

    map.on("sourcedata", clearWhenLoaded);
    map.on("error", clearOnError);
    return () => {
      map.off("sourcedata", clearWhenLoaded);
      map.off("error", clearOnError);
    };
  }, [map, setLoading]);

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
    if (!tileJSONMetadata) return;
    if (onFitToBounds) {
      onFitToBounds();
    } else {
      fitToBounds();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
