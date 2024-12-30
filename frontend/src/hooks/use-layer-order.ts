import { Map } from 'maplibre-gl';
import { TILE_BOUNDARY_LAYER_ID, TMS_LAYER_ID } from '@/constants';
import { useEffect, useRef } from 'react';

type UseLayerReorderProps = {
  /** IDs of all feature layers. (We want them above TMS.) */
  featureLayerIds: string[];
};

/**
 * Reorders layers in MapLibre so that:
 * - The TMS layer is below all feature layers.
 * - The boundary line layer is on top of everything.
 */
export const useLayerReorder = (
  map: Map | null,
  { featureLayerIds }: UseLayerReorderProps,
) => {
  const didReorder = useRef<boolean>(false);

  useEffect(() => {
    if (!map) return;

    const reorderLayers = () => {
      if (!map.isStyleLoaded()) return;
      // Move each feature layer on top of the TMS
      featureLayerIds.forEach((featureId) => {
        if (map.getLayer(featureId)) {
          try {
            map.moveLayer(featureId);
          } catch (err) {
            console.warn(`Error moving feature ${featureId} above TMS:`, err);
          }
        }
      });
      try {
        map.moveLayer(TILE_BOUNDARY_LAYER_ID);
      } catch (err) {
        console.warn("Error moving boundary line to top:", err);
      }
      didReorder.current = true;
    };
    // Re-run ordering whenever style data changes (and if not done already).
    const handleStyleData = () => {
      if (!didReorder.current) {
        reorderLayers();
      }
    };

    map.on("styledata", handleStyleData);

    return () => {
      map.off("styledata", handleStyleData);
    };
  }, [map, featureLayerIds, TMS_LAYER_ID, TILE_BOUNDARY_LAYER_ID]);
};
