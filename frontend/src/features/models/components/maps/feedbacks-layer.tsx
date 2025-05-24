import { CommentIcon } from "@/assets/images";
import {
  MODEL_FEEDBACKS_FILL_COLOR,
  MODEL_FEEDBACKS_FILL_LAYER_ID,
  MODEL_FEEDBACKS_FILL_OPACITY,
  MODEL_FEEDBACKS_OUTLINE_COLOR,
  MODEL_FEEDBACKS_OUTLINE_LAYER_ID,
  MODEL_FEEDBACKS_OUTLINE_WIDTH,
  MODEL_FEEDBACKS_SOURCE_ID,
  MODEL_FEEDBACKS_SYMBOL_LAYER_ID,
} from "@/config";
import { Feature, GeoJSONType } from "@/types";
import { GeoJSONSource, Map, Popup } from "maplibre-gl";
import { useEffect, useMemo, useRef, useState } from "react";

let markerIcon = new Image(17, 20);
markerIcon.src = CommentIcon;

export const FeedbacksLayer = ({
  map,
  features,
}: {
  map: Map | null;
  features?: Feature[];
}) => {
  const updatedFeatures = useMemo(() => {
    if (!features) return [];
    return features.map((feature) => ({
      ...feature,
      properties: {
        ...feature.properties,
        comment_length:
          feature?.properties && "comments" in feature.properties
            ? feature.properties.comments.length
            : 0,
      },
    }));
  }, [features]);

  const geoJsonData = useMemo(
    () => ({
      type: "FeatureCollection",
      features: updatedFeatures,
    }),
    [updatedFeatures],
  );

  const popupContainerRef = useRef<HTMLDivElement>(null);
  const popupInstanceRef = useRef<Popup | null>(null);
  const [clickedFeatureProperties, setClickedFeatureProperties] =
    useState<Record<string, string> | null>(null);
  useEffect(() => {
    if (!map) return;
    if (!map.getSource(MODEL_FEEDBACKS_SOURCE_ID)) {
      map.addSource(MODEL_FEEDBACKS_SOURCE_ID, {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
    }
    if (!map.getLayer(MODEL_FEEDBACKS_FILL_LAYER_ID)) {
      map.addLayer({
        id: MODEL_FEEDBACKS_FILL_LAYER_ID,
        type: "fill",
        source: MODEL_FEEDBACKS_SOURCE_ID,
        paint: {
          "fill-color": MODEL_FEEDBACKS_FILL_COLOR,
          "fill-opacity": MODEL_FEEDBACKS_FILL_OPACITY,
        },
        layout: { visibility: "visible" },
      });
    }
    if (!map.getLayer(MODEL_FEEDBACKS_OUTLINE_LAYER_ID)) {
      map.addLayer({
        id: MODEL_FEEDBACKS_OUTLINE_LAYER_ID,
        type: "line",
        source: MODEL_FEEDBACKS_SOURCE_ID,
        paint: {
          "line-color": MODEL_FEEDBACKS_OUTLINE_COLOR,
          "line-width": MODEL_FEEDBACKS_OUTLINE_WIDTH,
        },
        layout: { visibility: "visible" },
      });
    }

    if (!map.getImage("commentIcon")) {
      map.addImage("commentIcon", markerIcon, {
        // @ts-expect-error bad type definition
        width: 15,
        height: 15,
        data: markerIcon,
      });
    }

    if (!map.getLayer(MODEL_FEEDBACKS_SYMBOL_LAYER_ID)) {
      map.addLayer({
        id: MODEL_FEEDBACKS_SYMBOL_LAYER_ID,
        // Check the comment length before showing the icon.
        filter: [">=", ["get", "comment_length"], 1],
        type: "symbol",
        source: MODEL_FEEDBACKS_SOURCE_ID,
        layout: {
          "icon-image": "commentIcon",
          "icon-size": 1.5,
        },
      });
    }

    map.on("mouseenter", MODEL_FEEDBACKS_FILL_LAYER_ID, () => {
      map.getCanvas().style.cursor = "pointer";
    });

    map.on("mouseleave", MODEL_FEEDBACKS_FILL_LAYER_ID, () => {
      map.getCanvas().style.cursor = "";
    });

    map.on("click", MODEL_FEEDBACKS_FILL_LAYER_ID, (e: any) => {
      const properties = e.features && e.features[0].properties;
      if (properties) {
        if (properties.comment_length === 0) return;
        setClickedFeatureProperties(properties);
        if (popupContainerRef.current) {
          popupInstanceRef.current?.remove();
          const newPopup = new Popup({ closeButton: false })
            .setLngLat(e.lngLat)
            .setDOMContent(popupContainerRef.current)
            .addTo(map);
          popupInstanceRef.current = newPopup;
        }
      }
    });

    return () => {
      if (!map || !map.getStyle()) return;

      if (popupInstanceRef.current) {
        popupInstanceRef.current.remove();
      }
      if (map.getLayer(MODEL_FEEDBACKS_FILL_LAYER_ID)) {
        map.removeLayer(MODEL_FEEDBACKS_FILL_LAYER_ID);
      }
      if (map.getLayer(MODEL_FEEDBACKS_OUTLINE_LAYER_ID)) {
        map.removeLayer(MODEL_FEEDBACKS_OUTLINE_LAYER_ID);
      }
      if (map.getLayer(MODEL_FEEDBACKS_SYMBOL_LAYER_ID)) {
        map.removeLayer(MODEL_FEEDBACKS_SYMBOL_LAYER_ID);
      }
      if (map.getSource(MODEL_FEEDBACKS_SOURCE_ID)) {
        map.removeSource(MODEL_FEEDBACKS_SOURCE_ID);
      }
    };
  }, [map]);

  useEffect(() => {
    if (!map || !features) return;
    const source = map.getSource(MODEL_FEEDBACKS_SOURCE_ID) as GeoJSONSource;
    if (source) {
      source.setData(geoJsonData as GeoJSONType);
    }
  }, [map, geoJsonData]);

  if (!map) return null;
  if (!clickedFeatureProperties) return null;

  return (
    <div
      ref={popupContainerRef}
      className="w-60 h-40 bg-white rounded-md p-4 flex flex-col gap-y-2 overflow-auto"
    >
      <h1 className="text-body-2 font-semibold text-dark">Feedback</h1>
      <div className="flex flex-col gap-y-2">
        <ul>
          {Object.entries(clickedFeatureProperties)
            .filter(([key]) => key === "comments")
            .map(([key, value]) => (
              <li key={key} className="text-body-3 text-dark">
                {value}
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
};
