import { createContext, useContext, ReactNode, useState, useMemo } from "react";
import { Map } from "maplibre-gl";
import { TerraDraw } from "terra-draw";
import { setupTerraDraw } from "@/components/map/setup-terra-draw";

const MapContext = createContext<{
  map: Map | null;
  setMap: React.Dispatch<React.SetStateAction<Map | null>>;
  terraDraw: TerraDraw | undefined;
}>({
  map: null,
  setMap: () => {},
  terraDraw: undefined,
});

export const MapProvider = ({ children }: { children: ReactNode }) => {
  const [map, setMap] = useState<Map | null>(null);
  const terraDraw = useMemo(() => {
    if (map) {
      const terraDraw = setupTerraDraw(map);
      terraDraw.start();
      return terraDraw;
    }
  }, [map]);

  return (
    <MapContext.Provider value={{ map, setMap, terraDraw }}>
      {children}
    </MapContext.Provider>
  );
};

export const useMap = () => useContext(MapContext);
