import {
  createContext,
  useContext,
  ReactNode,
  useState,
  useMemo,
  useEffect,
} from "react";
import { Map } from "maplibre-gl";
import { TerraDraw } from "terra-draw";
import { setupTerraDraw } from "@/components/map/setup-terra-draw";
import { DrawingModes } from "@/enums";

const MapContext = createContext<{
  map: Map | null;
  setMap: React.Dispatch<React.SetStateAction<Map | null>>;
  terraDraw: TerraDraw | undefined;
  drawingMode: DrawingModes;
  setDrawingMode: React.Dispatch<React.SetStateAction<DrawingModes>>;
}>({
  map: null,
  setMap: () => {},
  terraDraw: undefined,
  drawingMode: DrawingModes.STATIC,
  setDrawingMode: () => DrawingModes,
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

  const [drawingMode, setDrawingMode] = useState<DrawingModes>(
    DrawingModes.STATIC,
  );

  // sync the modes
  useEffect(() => {
    terraDraw?.setMode(drawingMode);
  }, [terraDraw, drawingMode]);
  return (
    <MapContext.Provider
      value={{ map, setMap, terraDraw, drawingMode, setDrawingMode }}
    >
      {children}
    </MapContext.Provider>
  );
};

export const useMap = () => useContext(MapContext);
