import { FeatureCollection, TQueryParams } from "@/types";
import { Map } from "maplibre-gl";
import { MapComponent } from "@/components/map";
import { MapMarkerIcon } from "@/assets/images";
import { SEARCH_PARAMS } from "@/utils/search-params";
import { useCallback, useEffect } from "react";
import { useMapInstance } from "@/hooks/use-map-instance";

const mapSourceName = "datasets";
// Font from OpenFreeMap
const licensedFonts = ["Noto Sans Regular"];
// Font from Open Map Tiles
// const licensedFonts = ["Open Sans Semibold"];

let markerIcon = new Image(17, 20);
markerIcon.src = MapMarkerIcon;

const maplibreLayerDefn = (
  map: Map,
  mapResults: any,
  handleClickOnModelID: (clickedId: string) => void,
  disablePoiClick = false,
) => {
  map.addImage("mapMarker", markerIcon, {
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
    id: "modelsClusters",
    filter: ["has", "point_count"],
    type: "circle",
    source: mapSourceName,
    layout: {},
    paint: {
      "circle-color": "rgba(214, 63, 64,0.8)",
      "circle-radius": ["step", ["get", "point_count"], 14, 10, 22, 50, 30, 500, 37],
    },
  });

  map.addLayer({
    id: "cluster-count",
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
    id: "models-unclustered-points",
    type: "symbol",
    source: mapSourceName,
    filter: ["!", ["has", "point_count"]],
    layout: {
      "icon-image": "mapMarker",
      "text-field": "#{did}",
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

  map.on("mouseenter", "models-unclustered-points", () => {
    if (!disablePoiClick) {
      map.getCanvas().style.cursor = "pointer";
    }
  });

  map.on("mouseleave", "models-unclustered-points", () => {
    map.getCanvas().style.cursor = "";
  });

  map.on("click", "models-unclustered-points", (e: any) => {
    const value = e.features && e.features[0].properties && e.features[0].properties.did;
    handleClickOnModelID(value);
  });
};

type ModelsMapProps = {
  mapResults: FeatureCollection;
  updateQuery: (newParams: TQueryParams) => void;
};

export const DatasetsMap: React.FC<ModelsMapProps> = ({ mapResults, updateQuery }) => {
  const { map, mapContainerRef } = useMapInstance(false, false);

  const handleClickOnModelID = useCallback(
    (clickedModel: string) => {
      updateQuery({
        [SEARCH_PARAMS.id]: clickedModel,
      });
    },
    [updateQuery],
  );

  useEffect(() => {
    if (!map || !mapResults) return;

    const someResultsReady = mapResults.features && mapResults.features.length > 0;
    const mapReadyModelsReady =
      map.isStyleLoaded() && map.getSource(mapSourceName) === undefined && someResultsReady;

    if (mapReadyModelsReady) {
      maplibreLayerDefn(map, mapResults, handleClickOnModelID);
    } else {
      map.on("load", () => maplibreLayerDefn(map, mapResults, handleClickOnModelID));
    }
  }, [map, mapResults, handleClickOnModelID]);

  return (
    <div className="h-full w-full">
      <MapComponent geolocationControl map={map} mapContainerRef={mapContainerRef} zoomControls />
    </div>
  );
};
