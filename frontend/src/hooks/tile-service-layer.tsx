import { useTileServiceLayer } from "@/hooks/use-tileservice";
import { MapInstance } from "@/types";

export const TileServiceLayer = ({
  map,
  tileServiceURL,
  onFitToBounds,
}: {
  map: MapInstance;
  tileServiceURL: string;
  /** Override the default fitBounds-to-imagery behavior when tileJSON loads. */
  onFitToBounds?: () => void;
}) => {
  useTileServiceLayer({
    map,
    tileServiceURL,
    addLayerToMap: true,
    onFitToBounds,
  });
  return null;
};
