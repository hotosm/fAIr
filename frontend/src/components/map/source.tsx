import * as React from "react";
import { useEffect, useMemo, useState, useRef, cloneElement } from "react";

import { GeoJSONSource, ImageSource, SourceSpecification } from "maplibre-gl";
import { MapInstance, AnySourceImplementation } from "@/types";
import assert from "@/utils/assert";
import { deepEqual } from "@/utils/deep-equal";
import { MAP_STYLES_PREFIX } from "@/config";

export type SourceProps = SourceSpecification & {
  id?: string;
  map: MapInstance;
  children?: any;
};

let sourceCounter = 0;

function createSource(map: MapInstance, id: string, props: SourceProps) {
  if (map?.style && map?.isStyleLoaded()) {
    const options = { ...props };
    delete options.id;
    delete options.children;
    map?.addSource(id, options);
    return map?.getSource(id);
  }
  return null;
}

function updateSource(
  source: AnySourceImplementation,
  props: SourceProps,
  prevProps: SourceProps,
) {
  assert(props.id === prevProps.id, "source id changed");
  assert(props.type === prevProps.type, "source type changed");

  let changedKey = "";
  let changedKeyCount = 0;

  for (const key in props) {
    if (
      key !== "children" &&
      key !== "id" &&
      !deepEqual(
        (prevProps as Record<string, any>)[key],
        (props as Record<string, any>)[key],
      )
    ) {
      changedKey = key;
      changedKeyCount++;
    }
  }

  if (!changedKeyCount) {
    return;
  }

  const type = props.type;

  if (type === "geojson") {
    (source as GeoJSONSource).setData(props.data);
  } else if (type === "image") {
    (source as ImageSource).updateImage({
      url: props.url,
      coordinates: props.coordinates,
    });
  } else {
    switch (changedKey) {
      case "coordinates":
        // @ts-expect-error bad type definition
        source.setCoordinates?.(props.coordinates);
        break;
      case "url":
        // @ts-expect-error bad type definition
        source.setUrl?.(props.url);
        break;
      case "tiles":
        // @ts-expect-error bad type definition
        source.setTiles?.(props.tiles);
        break;
      default:
        console.warn(`Unable to update <Source> prop: ${changedKey}`);
    }
  }
}

export function Source(props: SourceProps) {
  const map = props.map;
  const propsRef = useRef(props);
  const [, setStyleLoaded] = useState<number>(0);

  const id = useMemo(
    () => props.id || `${MAP_STYLES_PREFIX}-${sourceCounter++}`,
    [],
  );

  useEffect(() => {
    if (map) {
      /* global setTimeout */
      const forceUpdate = () =>
        setTimeout(() => setStyleLoaded((version) => version + 1), 0);
      map.on("styledata", forceUpdate);
      forceUpdate();

      return () => {
        map.off("styledata", forceUpdate);

        if (map.style && map.isStyleLoaded() && map.getSource(id)) {
          // Parent effects are destroyed before child ones, see
          // https://github.com/facebook/react/issues/16728
          // Source can only be removed after all child layers are removed
          const allLayers = map.getStyle()?.layers;
          if (allLayers) {
            for (const layer of allLayers) {
              // @ts-ignore (2339) source does not exist on all layer types
              if (layer.source === id) {
                map.removeLayer(layer.id);
              }
            }
          }
          map.removeSource(id);
        }
      };
    }
    return undefined;
  }, [map]);

  let source = map && map.isStyleLoaded() && map.getSource(id);
  if (source) {
    updateSource(source, props, propsRef.current);
  } else {
    source = createSource(map, id, props);
  }
  propsRef.current = props;

  return (
    (source &&
      React.Children.map(
        props.children,
        (child) =>
          child &&
          cloneElement(child, {
            source: id,
          }),
      )) ||
    null
  );
}
