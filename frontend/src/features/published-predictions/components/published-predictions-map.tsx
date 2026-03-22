import { FeatureCollection } from "@/types";
import { Map } from "maplibre-gl";
import { MapComponent } from "@/components/map";
import { MapMarkerIcon } from "@/assets/images";
import { useCallback, useEffect } from "react";
import { useMapInstance } from "@/hooks/use-map-instance";

const mapSourceName = "published-predictions";
const licensedFonts = ["Noto Sans Regular"];

let markerIcon = new Image(17, 20);
markerIcon.src = MapMarkerIcon;

const getPredictionLabel = (feature: FeatureCollection["features"][number]) => {
  const featureId = getPredictionId(feature);

  return featureId ? `#${featureId}` : "";
};

const getPredictionId = (feature: FeatureCollection["features"][number]) => {
  const properties =
    feature.properties && typeof feature.properties === "object"
      ? (feature.properties as Record<string, unknown>)
      : {};

  return (
    properties.id ?? properties.pid ?? properties.prediction_id ?? feature.id
  );
};

const maplibreLayerDefn = (
  map: Map,
  mapResults: FeatureCollection,
  handleClickOnPredictionID: (clickedId: string) => void,
) => {
  map.addImage("publishedPredictionMarker", markerIcon, {
    // @ts-expect-error bad type definition
    width: 15,
    height: 15,
    data: markerIcon,
  });

  map.addSource(mapSourceName, {
    type: "geojson",
    data: mapResults,
    cluster: true,
    clusterRadius: 35,
  });

  map.addLayer({
    id: "publishedPredictionsClusters",
    filter: ["has", "point_count"],
    type: "circle",
    source: mapSourceName,
    layout: {},
    paint: {
      "circle-color": "rgba(214, 63, 64,0.8)",
      "circle-radius": [
        "step",
        ["get", "point_count"],
        14,
        10,
        22,
        50,
        30,
        500,
        37,
      ],
    },
  });

  map.addLayer({
    id: "published-predictions-cluster-count",
    type: "symbol",
    source: mapSourceName,
    filter: ["has", "point_count"],
    layout: {
      "text-field": "{point_count_abbreviated}",
      "text-font": licensedFonts,
      "text-size": 16,
    },
    paint: {
      "text-color": "#FFF",
      "text-halo-width": 10,
      "text-halo-blur": 1,
    },
  });

  map.addLayer({
    id: "published-predictions-unclustered-points",
    type: "symbol",
    source: mapSourceName,
    filter: ["!", ["has", "point_count"]],
    layout: {
      "icon-image": "publishedPredictionMarker",
      "text-field": ["get", "label"],
      "text-font": licensedFonts,
      "text-offset": [0, 0.6],
      "text-anchor": "top",
    },
    paint: {
      "text-color": "#2c3038",
      "text-halo-width": 1,
      "text-halo-color": "#fff",
    },
  });

  map.on("mouseenter", "published-predictions-unclustered-points", () => {
    map.getCanvas().style.cursor = "pointer";
  });

  map.on("mouseleave", "published-predictions-unclustered-points", () => {
    map.getCanvas().style.cursor = "";
  });

  map.on("click", "published-predictions-unclustered-points", (e: any) => {
    const clickedFeature = e.features?.[0];
    const clickedPredictionId = clickedFeature
      ? getPredictionId(clickedFeature)
      : undefined;

    if (clickedPredictionId) {
      handleClickOnPredictionID(String(clickedPredictionId));
    }
  });
};

type PublishedPredictionsMapProps = {
  mapResults: FeatureCollection;
  setPredictionId: (predictionId: string) => void;
};

export const PublishedPredictionsMap: React.FC<
  PublishedPredictionsMapProps
> = ({ mapResults, setPredictionId }) => {
  const { map, mapContainerRef } = useMapInstance(false, false);

  const handleClickOnPredictionID = useCallback(
    (clickedPredictionId: string) => {
      setPredictionId(clickedPredictionId);
    },
    [setPredictionId],
  );

  const getMapResultsWithLabels = useCallback((): FeatureCollection => {
    return {
      ...mapResults,
      features: mapResults.features.map((feature) => ({
        ...feature,
        properties: {
          ...(feature.properties ?? {}),
          label: getPredictionLabel(feature),
        },
      })),
    };
  }, [mapResults]);

  useEffect(() => {
    if (!map || !mapResults) return;

    const someResultsReady =
      mapResults.features && mapResults.features.length > 0;
    const mapReadyPredictionsReady =
      map.isStyleLoaded() &&
      map.getSource(mapSourceName) === undefined &&
      someResultsReady;

    const labeledMapResults = getMapResultsWithLabels();

    if (mapReadyPredictionsReady) {
      maplibreLayerDefn(map, labeledMapResults, handleClickOnPredictionID);
    } else {
      map.on("load", () =>
        maplibreLayerDefn(map, labeledMapResults, handleClickOnPredictionID),
      );
    }
  }, [map, mapResults, getMapResultsWithLabels, handleClickOnPredictionID]);

  return (
    <div className="h-full w-full">
      <MapComponent
        geolocationControl
        map={map}
        mapContainerRef={mapContainerRef}
        zoomControls
      />
    </div>
  );
};
