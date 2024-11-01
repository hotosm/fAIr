import { createContext, useContext, ReactNode, useState } from "react";
import "@shoelace-style/shoelace/dist/components/alert/alert.js";
import { Map } from "maplibre-gl";

const MapContext = createContext<{
  map: Map | null;
  setMap: React.Dispatch<React.SetStateAction<Map | null>>;
}>({
  map: null,
  setMap: () => {},
});

export const MapProvider = ({ children }: { children: ReactNode }) => {
  const [map, setMap] = useState<Map | null>(null);

  return (
    <MapContext.Provider value={{ map, setMap }}>
      {children}
    </MapContext.Provider>
  );
};

export const useMap = () => useContext(MapContext);
