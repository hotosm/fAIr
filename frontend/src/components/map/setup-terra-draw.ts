import {
  TerraDraw,
  TerraDrawMapLibreGLAdapter,
  ValidateNotSelfIntersecting,
  TerraDrawRectangleMode,
} from "terra-draw";
import maplibregl from "maplibre-gl";
import { TRAINING_AREAS_AOI_FILL_COLOR, TRAINING_AREAS_AOI_FILL_OPACITY, TRAINING_AREAS_AOI_OUTLINE_COLOR, TRAINING_AREAS_AOI_OUTLINE_WIDTH } from "@/utils";

export function setupTerraDraw(map: maplibregl.Map) {
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
      //     arbitary: {
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
          return true;
        },
        styles: {
          // Fill colour (a string containing a 6 digit Hex color)
          fillColor: TRAINING_AREAS_AOI_FILL_COLOR,

          // Fill opacity (0 - 1)
          fillOpacity: TRAINING_AREAS_AOI_FILL_OPACITY,

          // Outline colour (Hex color)
          outlineColor: TRAINING_AREAS_AOI_OUTLINE_COLOR,

          //Outline width (Integer)
          outlineWidth: TRAINING_AREAS_AOI_OUTLINE_WIDTH,
        },
      }),
    ],
  });
}
