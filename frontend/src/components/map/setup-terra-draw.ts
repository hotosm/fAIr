import {
  TerraDraw,
  TerraDrawMapLibreGLAdapter,
  ValidateNotSelfIntersecting,
  TerraDrawRectangleMode,
} from "terra-draw";
import maplibregl from "maplibre-gl";

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
          fillColor: "#d63f40",

          // Fill opacity (0 - 1)
          fillOpacity: 0.3,

          // Outline colour (Hex color)
          outlineColor: "#d63f40",

          //Outline width (Integer)
          outlineWidth: 4,
        },
      }),
    ],
  });
}
