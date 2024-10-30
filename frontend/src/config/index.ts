// MAP SETTINGS

import { StyleSpecification } from "maplibre-gl";

// References -
// - https://medium.com/@go2garret/free-basemap-tiles-for-maplibre-18374fab60cb
// - https://codepen.io/g2g/pen/rNRJBZg

export const MAP_STYLES: Record<string, string | StyleSpecification> = {
  OSM: {
    version: 8,
    sources: {
      osm: {
        type: "raster",
        tiles: ["https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"],
        tileSize: 256,
        attribution: "&copy; OpenStreetMap Contributors",
        maxzoom: 19,
      },
    },
    layers: [
      {
        id: "osm",
        type: "raster",
        source: "osm",
      },
    ],
  },
  Satellite: "https://geoserveis.icgc.cat/contextmaps/icgc_orto_estandard.json",
};
