import axios from "axios";
import { BBOX } from "@/types";
import {
  HOT_IMAGERY_COLLECTION_ID,
  HOT_IMAGERY_RASTER_API_URL,
  HOT_IMAGERY_STAC_API_URL,
  NOMINATIM_API_URL,
} from "@/config";

// ── Types ─────────────────────────────────────────────────────────────────────

/** A lean, UI-friendly view of an OpenAerialMap imagery item. */
export type OAMImageryItem = {
  id: string;
  bbox: BBOX;
  geometry: GeoJSON.Geometry;
  title: string;
  provider: string;
  /** Ground sample distance in meters, e.g. 0.02 for 2 cm. */
  gsd: number | null;
  /** Acquisition date (ISO string). */
  acquiredAt: string | null;
  license: string | null;
  platform: string | null;
  thumbnailUrl: string | null;
  /** Name of the renderable asset on the raster API (usually "visual"). */
  assetName: string;
};

export type GeocodeResult = {
  displayName: string;
  bbox: BBOX;
  center: [number, number];
};

type StacImageryFeature = {
  id: string;
  bbox: BBOX;
  type: "Feature";
  geometry: GeoJSON.Geometry;
  assets: Record<string, { href: string } | undefined>;
  properties: {
    title?: string;
    gsd?: number;
    license?: string;
    created?: string;
    start_datetime?: string;
    end_datetime?: string;
    providers?: Array<{ name: string }>;
    "oam:platform_type"?: string;
    "oam:producer_name"?: string;
  };
};

type StacSearchResponse = {
  type: "FeatureCollection";
  features: StacImageryFeature[];
};

const toImageryItem = (feature: StacImageryFeature): OAMImageryItem => {
  const { properties, assets } = feature;
  const assetName = assets.visual
    ? "visual"
    : (Object.keys(assets)[0] ?? "visual");
  return {
    id: feature.id,
    bbox: feature.bbox,
    geometry: feature.geometry,
    title: properties.title ?? "Untitled Image",
    provider:
      properties["oam:producer_name"] ??
      properties.providers?.[0]?.name ??
      "Unknown",
    gsd: properties.gsd ?? null,
    acquiredAt: properties.end_datetime ?? properties.created ?? null,
    license: properties.license ?? null,
    platform: properties["oam:platform_type"] ?? null,
    thumbnailUrl: assets.thumbnail?.href ?? null,
    assetName,
  };
};

// ── URL builders ──────────────────────────────────────────────────────────────

/**
 * XYZ tile URL template that renders an OpenAerialMap item through the raster
 * (titiler) API — the same scheme imagery.hotosm.org uses. The item id and
 * asset name come straight from the footprint PMTiles feature.
 */
export const getImageryTileUrl = (
  itemId: string,
  assetName: string = "visual",
): string =>
  `${HOT_IMAGERY_RASTER_API_URL}/collections/${HOT_IMAGERY_COLLECTION_ID}/items/${itemId}/tiles/WebMercatorQuad/{z}/{x}/{y}@1x?assets=${assetName}&nodata=0`;

// ── API calls ─────────────────────────────────────────────────────────────────

/**
 * List the OpenAerialMap images intersecting a bounding box, via the HOT
 * imagery STAC catalog. Used to populate the "images within selected grid
 * square" panel once the user picks a density cell.
 */
export const searchImagery = async ({
  bbox,
  limit = 50,
  signal,
}: {
  bbox: BBOX;
  limit?: number;
  signal?: AbortSignal;
}): Promise<OAMImageryItem[]> => {
  const { data } = await axios.post<StacSearchResponse>(
    `${HOT_IMAGERY_STAC_API_URL}/search`,
    { collections: [HOT_IMAGERY_COLLECTION_ID], bbox, limit },
    { signal },
  );
  return data.features.map(toImageryItem);
};

type NominatimResult = {
  display_name: string;
  boundingbox: string[];
  lat: string;
  lon: string;
};

const toGeocodeResult = (r: NominatimResult): GeocodeResult => {
  const [south, north, west, east] = r.boundingbox.map(parseFloat);
  return {
    displayName: r.display_name,
    bbox: [west, south, east, north],
    center: [parseFloat(r.lon), parseFloat(r.lat)],
  };
};

export type CountryResult = {
  /** Country name, e.g. "Brazil". */
  country: string;
  /** ISO 3166-1 alpha-2 code, lower-cased (e.g. "br"); "" when unknown. */
  countryCode: string;
};

/**
 * Reverse-geocode a coordinate to its country via Nominatim. The imagery's tile
 * URL carries no location, so the country is derived from the imagery's center
 * (or any point inside its bounds). `zoom: 3` keeps Nominatim at country level.
 */
export const reverseGeocodeCountry = async (
  lon: number,
  lat: number,
  signal?: AbortSignal,
): Promise<CountryResult | null> => {
  const { data } = await axios.get<{
    address?: { country?: string; country_code?: string };
  }>(`${NOMINATIM_API_URL}/reverse`, {
    params: { format: "json", lat, lon, zoom: 3, addressdetails: 1 },
    signal,
  });
  const country = data?.address?.country;
  if (!country) return null;
  return {
    country,
    countryCode: (data.address?.country_code ?? "").toLowerCase(),
  };
};

/**
 * Autocomplete suggestions for a location query (up to `limit`), each with a
 * bounding box for map.fitBounds. Powers the search box's suggestion dropdown.
 */
export const geocodeSuggestions = async (
  query: string,
  limit = 5,
  signal?: AbortSignal,
): Promise<GeocodeResult[]> => {
  const { data } = await axios.get<NominatimResult[]>(
    `${NOMINATIM_API_URL}/search`,
    { params: { format: "json", q: query, limit }, signal },
  );
  return (data ?? []).map(toGeocodeResult);
};
