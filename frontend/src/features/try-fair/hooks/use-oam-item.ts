import { useEffect, useState } from "react";
import axios from "axios";
import {
  HOT_IMAGERY_COLLECTION_ID,
  HOT_IMAGERY_STAC_API_URL,
} from "@/config";
import { OAMImageryItem } from "@/features/try-fair/api/hot-imagery";

type StacItemRaw = {
  id: string;
  bbox: [number, number, number, number];
  geometry: GeoJSON.Geometry;
  assets: Record<string, { href: string } | undefined>;
  properties: {
    title?: string;
    gsd?: number;
    license?: string;
    created?: string;
    end_datetime?: string;
    providers?: Array<{ name: string }>;
    "oam:platform_type"?: string;
    "oam:producer_name"?: string;
  };
};

const toOAMItem = (raw: StacItemRaw): OAMImageryItem => {
  const assetName = raw.assets.visual
    ? "visual"
    : (Object.keys(raw.assets)[0] ?? "visual");
  return {
    id: raw.id,
    bbox: raw.bbox,
    geometry: raw.geometry,
    title: raw.properties.title ?? "Untitled Image",
    provider:
      raw.properties["oam:producer_name"] ??
      raw.properties.providers?.[0]?.name ??
      "Unknown",
    gsd: raw.properties.gsd ?? null,
    acquiredAt: raw.properties.end_datetime ?? raw.properties.created ?? null,
    license: raw.properties.license ?? null,
    platform: raw.properties["oam:platform_type"] ?? null,
    thumbnailUrl: raw.assets.thumbnail?.href ?? null,
    assetName,
  };
};

/**
 * Fetches a single OpenAerialMap STAC item by its ID.
 * Used to hydrate the imagery selection from a shared URL on page load.
 *
 * Returns `null` while loading or if the item cannot be found.
 */
export const useOAMItem = (
  itemId: string | null,
): { item: OAMImageryItem | null; loading: boolean; error: boolean } => {
  const [item, setItem] = useState<OAMImageryItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!itemId) {
      setItem(null);
      setError(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(false);

    axios
      .get<StacItemRaw>(
        `${HOT_IMAGERY_STAC_API_URL}/collections/${HOT_IMAGERY_COLLECTION_ID}/items/${encodeURIComponent(itemId)}`,
        { signal: controller.signal },
      )
      .then(({ data }) => {
        if (!controller.signal.aborted) {
          setItem(toOAMItem(data));
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setError(true);
          setItem(null);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [itemId]);

  return { item, loading, error };
};
