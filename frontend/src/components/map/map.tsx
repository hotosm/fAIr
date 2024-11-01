import { useEffect, useRef, useState } from "react";
import maplibregl, {
  LayerSpecification,
  Map,
  SourceSpecification,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { MAP_STYLES } from "@/config";
import ZoomControls from "./zoom-controls";
import GeolocationControl from "./geolocation-control";
import DrawControl from "./draw-control";
import ZoomLevel from "./zoom-level";
import LayerControl from "./layer-control";

type MapComponentProps = {
  onMapLoad?: (map: Map) => void;
  geolocationControl?: boolean;
  controlsLocation?: "top-right" | "top-left";
  drawControl?: boolean;
  showCurrentZoom?: boolean;
  layerControl?: boolean;
  sources?: {
    sourceId: string;
    spec: SourceSpecification;
  }[];
  layers?: LayerSpecification[];
  layerControlLayers?: {
    value: string;
    mapLayerId: string;
  }[];
};

const MapComponent: React.FC<MapComponentProps> = ({
  onMapLoad,
  geolocationControl = false,
  controlsLocation = "top-right",
  drawControl = false,
  showCurrentZoom = false,
  layerControl = false,
  sources = [],
  layers = [],
  layerControlLayers = [],
}) => {
  const mapContainerRef = useRef(null);
  const [map, setMap] = useState<Map | null>(null);
  const [selectedBasemap, setSelectedBasemap] = useState<string>("OSM");

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      //@ts-ignore
      style: MAP_STYLES[selectedBasemap],
      center: [0, 0],
      zoom: 0.5,
      minZoom: 1,
      maxZoom: 21,
    });

    const onStyleLoad = () => {
      onMapLoad?.(map);
      setMap(map);
    };

    map.on("style.load", () => {
      onStyleLoad();
    });

    return () => {
      map.off("style.load", onStyleLoad);
      map.remove();
    };
  }, []);

  // Update basemap.
  useEffect(() => {
    if (!map?.loaded) return;
    map.setStyle(MAP_STYLES[selectedBasemap]);
  }, [selectedBasemap]);

  useEffect(() => {
    if (
      !map ||
      !map.isStyleLoaded() ||
      layers.length === 0 ||
      sources.length === 0
    )
      return;

    const addSources = () => {
      sources.forEach((source) => {
        if (!map.getSource(source.sourceId)) {
          map.addSource(source.sourceId, source.spec);
        }
      });
    };

    const addLayers = () => {
      layers.forEach((layer) => {
        if (!map.getLayer(layer.id)) {
          map.addLayer({ ...layer });
        }
      });
    };

    const addSourcesAndLayers = () => {
      addSources();
      addLayers();
    };

    addSourcesAndLayers();

    // Re-add sources and layers on style change
    map.on("styledata", addSourcesAndLayers);

    return () => {
      map.off("styledata", addSourcesAndLayers);
    };
  }, [sources, layers, map]);

  return (
    <div className="h-full w-full relative" ref={mapContainerRef}>
      <div
        className={`absolute top-5 ${controlsLocation === "top-right" ? "right-3" : "left-3"} z-[10] flex flex-col gap-y-[1px]`}
      >
        <ZoomControls map={map} />
        {geolocationControl && <GeolocationControl map={map} />}
        {drawControl && <DrawControl map={map} />}
      </div>
      <div
        className={`absolute top-5 right-10 z-[10] items-center flex gap-x-4`}
      >
        {showCurrentZoom && <ZoomLevel map={map} />}
        {layerControl && (
          <LayerControl
            selectedBasemap={selectedBasemap}
            setSelectedBasemap={setSelectedBasemap}
            map={map}
            layers={layerControlLayers}
          />
        )}
      </div>
    </div>
  );
};

export default MapComponent;
