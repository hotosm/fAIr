import { createContext, useContext, ReactNode, useState, useMemo } from "react";
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
  const memoizedValues = useMemo(() => ({ map, setMap }), [map, setMap]);
  return (
    <MapContext.Provider value={memoizedValues}>{children}</MapContext.Provider>
  );
};

export const useMap = () => useContext(MapContext);
