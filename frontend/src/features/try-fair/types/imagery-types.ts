import { TileServiceType, ImagerySource } from "@/enums";
import { BBOX } from "@/types";

/** A lean, UI-friendly view of an OpenAerialMap STAC imagery item. */
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

export type AppliedCustomImagery = {
  tileUrl: string;
  tileServiceType: TileServiceType;
  bounds: BBOX | null;
};
/** The imagery choice emitted by the imagery/location dialog on Apply. */
export type ImagerySelection =
  | {
      source: ImagerySource.OPEN_AERIAL_MAP;
      item: OAMImageryItem;
      /** Titiler XYZ tile URL template for the selected item. */
      tileUrl: string;
      bounds: BBOX;
    }
  | {
      source: ImagerySource.CUSTOM;
      tileUrl: string;
      tileServiceType: TileServiceType;
      bounds: BBOX | null;
    };
export type DatePreset = "" | "week" | "month" | "year";
export type ResolutionPreset = "" | "lt05" | "05to2" | "2to10" | "gt10";
