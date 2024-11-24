import { useMap } from "@/app/providers/map-provider";
import { LayerSpecification, SourceSpecification } from "maplibre-gl";
import { useCallback, useEffect } from "react";

export const useMapLayers = (
  layersSpec: LayerSpecification[],
  sourcesSpec: { id: string; spec: SourceSpecification }[],
) => {
  const { map } = useMap();

  const addSourcesAndLayers = useCallback(() => {
    if (!map || !map.isStyleLoaded()) return;
    // Sources
    for (let x = 0; x < sourcesSpec.length; x++) {
      const sourceId = sourcesSpec[x].id;
      if (!map.getSource(sourceId)) {
        map.addSource(sourceId, sourcesSpec[x].spec);
      }
    }
    // Layers
    for (let x = 0; x < layersSpec.length; x++) {
      if (!map.getLayer(layersSpec[x].id)) {
        map.addLayer(layersSpec[x]);
      }
    }
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
  }, [map, addSourcesAndLayers]);

  return null;
};
