import L from "leaflet";
import { useMap } from "react-leaflet";
import { useEffect } from "react";

const CustomGridLayer = () => {
  const map = useMap();

  const createTile = () => {
    const tile = document.createElement("div");
    tile.style.outline = "2px solid rgba(255, 255, 255, 0.4)";
    tile.style.width = "256px";
    tile.style.height = "256px";
    return tile;
  };

  const createGridLayer = () => {
    const gridLayer = L.GridLayer.extend({
      zIndex: 2,
      createTile: createTile,
    });

    return new gridLayer();
  };

  useEffect(() => {
    const gridLayer = createGridLayer().addTo(map);

    return () => {
      map.removeLayer(gridLayer);
    };
  }, [map]);

  return null;
};

export default CustomGridLayer;
