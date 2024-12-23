import { MAX_ZOOM_LEVEL } from "@/utils";
import maplibregl, { Map, StyleSpecification } from "maplibre-gl";
import { Protocol } from "pmtiles";

export const setupMaplibreMap = (
  containerRef: React.RefObject<HTMLElement>,
  style: StyleSpecification | string,
  pmtiles: boolean
): Map => {
  // Check if RTL plugin is needed and set it
  if (maplibregl.getRTLTextPluginStatus() === "unavailable") {
    maplibregl.setRTLTextPlugin(
      "https://unpkg.com/@mapbox/mapbox-gl-rtl-text@0.2.3/mapbox-gl-rtl-text.min.js",
      true,
    );
  }

  if (pmtiles) {
    let protocol = new Protocol();
    maplibregl.addProtocol("pmtiles", protocol.tile);
  }

  const map = new maplibregl.Map({
    container: containerRef.current!,
    style: style,
    center: [0, 0],
    zoom: 0.5,
    minZoom: 1,
    maxZoom: MAX_ZOOM_LEVEL,
    pitchWithRotate: false
  })

  // Prevent the map from rotating
  map.on('rotatestart', () => {
    map.setBearing(0);
  });

  map.on('rotate', () => {
    map.setBearing(0);
  });

  map.on('rotateend', () => {
    map.setBearing(0);
  });

  return map
};
