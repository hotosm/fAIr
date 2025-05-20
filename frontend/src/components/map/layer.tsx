import { MAP_STYLES_PREFIX } from "@/config";
import { MapInstance } from "@/types";
import assert from "@/utils/assert";
import { deepEqual } from "@/utils/deep-equal";
import { LayerSpecification } from "maplibre-gl";
import { useEffect, useMemo, useRef, useState } from "react";

type LayerProps = LayerSpecification & {
  id: string;
  // Map will be passed from the parent component until we have a better solution e.g. context
  // or a custom hook to get the map instance.
  map: MapInstance;
  beforeId?: string;
};

/**
 * Inspired by: https://github.com/visgl/react-map-gl/blob/master/modules/react-maplibre/src/components/layer.ts
 */

/* eslint-disable complexity, max-statements */
function updateLayer(
  map: MapInstance,
  id: string,
  props: LayerProps,
  prevProps: LayerProps,
) {
  assert(props.id === prevProps.id, "layer id changed");
  assert(props.type === prevProps.type, "layer type changed");

  // @ts-ignore filter does not exist in some Layer types
  const { layout = {}, paint = {}, filter, minzoom, maxzoom, beforeId } = props;

  if (beforeId !== prevProps.beforeId) {
    map?.moveLayer(id, beforeId);
  }
  if (layout !== prevProps.layout) {
    const prevLayout: Record<string, any> = prevProps.layout || {};
    const currLayout: Record<string, any> = layout || {};
    for (const key in currLayout) {
      if (!deepEqual(currLayout[key], prevLayout[key])) {
        map?.setLayoutProperty(id, key, currLayout[key]);
      }
    }
    for (const key in prevLayout) {
      if (!currLayout.hasOwnProperty(key)) {
        map?.setLayoutProperty(id, key, undefined);
      }
    }
  }
  if (paint !== prevProps.paint) {
    const prevPaint: Record<string, any> = prevProps.paint || {};
    const currPaint: Record<string, any> = paint || {};
    for (const key in paint) {
      if (!deepEqual(currPaint[key], prevPaint[key])) {
        map?.setPaintProperty(id, key, currPaint[key]);
      }
    }
    for (const key in prevPaint) {
      if (!paint.hasOwnProperty(key)) {
        map?.setPaintProperty(id, key, undefined);
      }
    }
  }

  // @ts-ignore filter does not exist in some Layer types
  if (!deepEqual(filter, prevProps.filter)) {
    map?.setFilter(id, filter);
  }
  if (minzoom !== prevProps.minzoom || maxzoom !== prevProps.maxzoom) {
    map?.setLayerZoomRange(id, minzoom as number, maxzoom as number);
  }
}

function createLayer(map: MapInstance, id: string, props: LayerProps) {
  if (
    map?.style &&
    map.isStyleLoaded() &&
    (!("source" in props) || map.getSource(props.source))
  ) {
    const options: LayerProps = { ...props, id };
    delete options.beforeId;
    map.addLayer(options, props.beforeId);
  }
}

let layerCounter = 0;
export const Layer: React.FC<LayerProps> = (props) => {
  const { map } = props;
  const propsRef = useRef<LayerProps>(props);
  const id = useMemo(
    () => props.id || `${MAP_STYLES_PREFIX}-layer-${layerCounter++}`,
    [],
  );
  /**
   * This is a workaround to force a re-render of the component when the style is loaded.
   */
  const [, setStyleLoaded] = useState<number>(0);

  useEffect(() => {
    if (map) {
      const forceUpdate = () => setStyleLoaded((version) => version + 1);
      map.on("styledata", forceUpdate);
      forceUpdate();

      return () => {
        map.off("styledata", forceUpdate);
        /**
         * This is a workaround to remove the layer when the style is unloaded.
         */
        if (map.style && map.isStyleLoaded() && map.getLayer(id)) {
          map.removeLayer(id);
        }
      };
    }
    return undefined;
  }, [map]);

  const layer = map && map.style && map.getLayer(id);
  if (layer) {
    try {
      updateLayer(map, id, props, propsRef.current);
    } catch (error) {
      console.warn(error);
    }
  } else {
    createLayer(map, id, props);
  }

  /**
   * Store last rendered props
   *
   */
  propsRef.current = props;
  return null;
};
