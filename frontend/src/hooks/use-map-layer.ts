import { addLayers, addSources, } from "@/utils/map-utils";
import { LayerSpecification, Map, SourceSpecification } from "maplibre-gl";
import { useCallback, useEffect } from "react";

export const useMapLayers = (
  layersSpec: LayerSpecification[],
  sourcesSpec: { id: string; spec: SourceSpecification }[],
  map: Map | null
) => {

  const addSourcesAndLayers = useCallback(() => {
    if (!map || !map.isStyleLoaded()) return;
    addSources(map, sourcesSpec)
    addLayers(map, layersSpec)

  }, [map, sourcesSpec, layersSpec]);

  useEffect(() => {
    if (!map) return;
    if (!map.isStyleLoaded()) {
      map.once("styledata", addSourcesAndLayers);
    } else {
      addSourcesAndLayers();
    }
    return () => {
      map.off("styledata", addSourcesAndLayers);
    };
  }, [map, addSourcesAndLayers, layersSpec, sourcesSpec]);

  return null;
};
