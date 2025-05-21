import { useTileServiceLayer } from "@/hooks/use-tileservice";
import { MapInstance } from "@/types";

export const TileServiceLayer = ({
  map,
  tileServiceURL,
}: {
  map: MapInstance;
  tileServiceURL: string;
}) => {
  useTileServiceLayer({
    map,
    tileServiceURL,
    addLayerToMap: true,
  });
  return null;
};
