import {
  createContext,
  useContext,
  ReactNode,
  useState,
  useMemo,
  useEffect,
  useCallback,
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
  currentZoom: number;
}>({
  map: null,
  setMap: () => {},
  terraDraw: undefined,
  drawingMode: DrawingModes.STATIC,
  setDrawingMode: () => DrawingModes,
  currentZoom: 0,
});

export const MapProvider = ({ children }: { children: ReactNode }) => {
  const [map, setMap] = useState<Map | null>(null);
  const [currentZoom, setCurrentZoom] = useState<number>(0);
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

  // Sync the drawing modes between terraDraw
  // and the application state
  useEffect(() => {
    terraDraw?.setMode(drawingMode);
  }, [terraDraw, drawingMode]);

  const updateZoom = useCallback(() => {
    if (!map) return;
    // There is a mismatch of 1 in the mag.getZoom() results and the actual zoom level of the map.
    // Adding 1 to the result resolves it.
    setCurrentZoom(Math.round(map.getZoom()) + 1);
  }, [map]);

  useEffect(() => {
    if (!map) return;
    map.on("zoomend", updateZoom);
    return () => {
      map.off("zoomend", updateZoom);
    };
  }, [map]);

  return (
    <MapContext.Provider
      value={{
        map,
        setMap,
        terraDraw,
        drawingMode,
        setDrawingMode,
        currentZoom,
      }}
    >
      {children}
    </MapContext.Provider>
  );
};

export const useMap = () => useContext(MapContext);
