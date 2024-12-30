import { LayerSpecification, Map, SourceSpecification } from 'maplibre-gl';

export const addSources = (
  map: Map,
  sources: { id: string; spec: SourceSpecification }[],
) => {
  if (!map) return;
  sources.forEach((source) => {
    if (!map?.getSource(source.id)) {
      map.addSource(source.id, source.spec);
    }
  });
};

export const removeSources = (
  map: Map,
  sources: { id: string; spec: SourceSpecification }[],
) => {
  if (!map) return;
  sources.forEach((source) => {
    if (map?.getSource(source.id)) {
      map.removeSource(source.id);
    }
  });
};

export const addLayers = (map: Map, layers: LayerSpecification[]) => {
  if (!map) return;
  layers.forEach((layer) => {
    if (!map?.getLayer(layer.id)) {
      map.addLayer(layer);
    }
  });
};

export const removeLayers = (map: Map, layers: LayerSpecification[]) => {
  if (!map) return;
  layers.forEach((layer) => {
    if (map?.getLayer(layer.id)) {
      map.removeLayer(layer.id);
    }
  });
};
