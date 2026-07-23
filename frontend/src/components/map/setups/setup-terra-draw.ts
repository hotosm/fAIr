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

export const setupTerraDraw = (
  map: maplibregl.Map,
  styleVariant: TerraDrawStyleVariant = "red",
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
