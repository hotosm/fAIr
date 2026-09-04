import maplibregl from "maplibre-gl";
import {
  TerraDraw,
  ValidateNotSelfIntersecting,
  TerraDrawRectangleMode,
  TerraDrawExtend,
  TerraDrawSelectMode,
  TerraDrawPolygonMode,
} from "terra-draw";
import { TerraDrawMapLibreGLAdapter } from "terra-draw-maplibre-gl-adapter";
import {
  TRAINING_AREAS_AOI_FILL_COLOR,
  TRAINING_AREAS_AOI_FILL_OPACITY,
  TRAINING_AREAS_AOI_OUTLINE_COLOR,
  TRAINING_AREAS_AOI_OUTLINE_WIDTH,
} from "@/config";
import { BBOX } from "@/types";

export type TerraDrawStyleVariant = "default" | "red";

export const DEFAULT_AOI_STYLE = {
  fillColor: TRAINING_AREAS_AOI_FILL_COLOR as TerraDrawExtend.HexColorStyling,
  fillOpacity: TRAINING_AREAS_AOI_FILL_OPACITY,
  outlineColor: TRAINING_AREAS_AOI_OUTLINE_COLOR as TerraDrawExtend.HexColorStyling,
  outlineWidth: TRAINING_AREAS_AOI_OUTLINE_WIDTH,
};

export const RED_AOI_STYLE = {
  fillColor: "#D73434" as TerraDrawExtend.HexColorStyling,
  fillOpacity: 0.25,
  outlineColor: "#D73434" as TerraDrawExtend.HexColorStyling,
  outlineWidth: 2,
};

/**
 * Checks if every committed vertex in the ring lies inside the imagery bounds.
 * The closing duplicate coordinate is excluded.
 */
const allCoordsWithinBounds = (coords: number[][], bounds: BBOX): boolean => {
  const [west, south, east, north] = bounds;
  // Exclude the closing duplicate (last coord === first coord)
  const ring = coords.slice(0, -1);
  return ring.every(([lng, lat]) => lng >= west && lng <= east && lat >= south && lat <= north);
};

export const setupTerraDraw = (
  map: maplibregl.Map,
  styleVariant: TerraDrawStyleVariant = "red",
  /** Optional imagery bounding box – when provided, polygon vertices outside
   *  this box are rejected live as the user draws. */
  imageryBounds?: BBOX | null,
) => {
  const styles = styleVariant === "red" ? RED_AOI_STYLE : DEFAULT_AOI_STYLE;

  return new TerraDraw({
    tracked: true,
    adapter: new TerraDrawMapLibreGLAdapter({
      map,
      coordinatePrecision: 20,
    }),
    modes: [
      new TerraDrawSelectMode({
        flags: {
          arbitary: {
            feature: {},
          },
          rectangle: {
            feature: {
              draggable: true,
              coordinates: {
                resizable: "opposite",
              },
            },
          },
          polygon: {
            feature: {
              draggable: true,
              coordinates: {
                midpoints: true,
                draggable: true,
                deletable: true,
              },
            },
          },
        },
      }),
      new TerraDrawPolygonMode({
        validation: (feature, { updateType }) => {
          if (updateType === "commit" && imageryBounds) {
            // Reject any vertex committed outside the imagery bounds.
            const coords = (feature.geometry as { coordinates: number[][][] })?.coordinates?.[0];
            if (coords && !allCoordsWithinBounds(coords, imageryBounds)) {
              return {
                valid: false,
                reason: "Point is outside the imagery bounds.",
              };
            }
          }
          if (updateType === "finish" || updateType === "commit") {
            return ValidateNotSelfIntersecting(feature);
          }
          return { valid: true };
        },
        styles,
      }),
      new TerraDrawRectangleMode({
        validation: (feature, { updateType }) => {
          if (updateType === "finish" || updateType === "commit") {
            return ValidateNotSelfIntersecting(feature);
          }
          return {
            valid: true,
          };
        },
        styles,
      }),
    ],
  });
};
