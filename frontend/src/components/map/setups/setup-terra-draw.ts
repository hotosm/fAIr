import maplibregl from "maplibre-gl";
import {
  TerraDraw,
  ValidateNotSelfIntersecting,
  TerraDrawRectangleMode,
  TerraDrawExtend,
} from "terra-draw";
import { TerraDrawMapLibreGLAdapter } from "terra-draw-maplibre-gl-adapter";
import {
  TRAINING_AREAS_AOI_FILL_COLOR,
  TRAINING_AREAS_AOI_FILL_OPACITY,
  TRAINING_AREAS_AOI_OUTLINE_COLOR,
  TRAINING_AREAS_AOI_OUTLINE_WIDTH,
} from "@/config";

export const setupTerraDraw = (map: maplibregl.Map) => {
  return new TerraDraw({
    tracked: true,
    adapter: new TerraDrawMapLibreGLAdapter({
      map,
      coordinatePrecision: 16,
    }),
    // idStrategy: {
    //   isValidId: () => true,
    //   getId: (function () {
    //     let id = 0;
    //     return function () {
    //       return ++id;
    //     };
    //   })(),
    // },
    modes: [
      // new TerraDrawSelectMode({
      //   flags: {
      //     arbitrary: {
      //       feature: {},
      //     },
      //     rectangle: {
      //       feature: {
      //         draggable: true,
      //         coordinates: {
      //           resizable: "opposite",
      //         },
      //       },
      //     },
      //   },
      // }),
      new TerraDrawRectangleMode({
        validation: (feature, { updateType }) => {
          if (updateType === "finish" || updateType === "commit") {
            return ValidateNotSelfIntersecting(feature);
          }
          return {
            valid: true,
          };
        },
        styles: {
          // Fill colour (a string containing a 6 digit Hex color)
          fillColor:
            TRAINING_AREAS_AOI_FILL_COLOR as TerraDrawExtend.HexColorStyling,

          // Fill opacity (0 - 1)
          fillOpacity: TRAINING_AREAS_AOI_FILL_OPACITY,

          // Outline colour (Hex color)
          outlineColor:
            TRAINING_AREAS_AOI_OUTLINE_COLOR as TerraDrawExtend.HexColorStyling,

          //Outline width (Integer)
          outlineWidth: TRAINING_AREAS_AOI_OUTLINE_WIDTH,
        },
      }),
    ],
  });
};
