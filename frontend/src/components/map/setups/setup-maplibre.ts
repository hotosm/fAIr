import { MAX_ZOOM_LEVEL } from "@/utils";
import maplibregl, { Map, StyleSpecification } from "maplibre-gl";
import { Protocol } from "pmtiles";

export const setupMaplibreMap = (
  containerRef: React.RefObject<HTMLElement>,
  style: StyleSpecification | string,
): Map => {
  // Check if RTL plugin is needed and set it
  if (maplibregl.getRTLTextPluginStatus() === "unavailable") {
    maplibregl.setRTLTextPlugin(
      "https://unpkg.com/@mapbox/mapbox-gl-rtl-text@0.2.3/mapbox-gl-rtl-text.min.js",
      true,
    );
  }

  let protocol = new Protocol();
  maplibregl.addProtocol("pmtiles", protocol.tile);

  return new maplibregl.Map({
    container: containerRef.current!,
    style: style,
    center: [0, 0],
    zoom: 0.5,
    minZoom: 1,
    maxZoom: MAX_ZOOM_LEVEL,
  });
};
