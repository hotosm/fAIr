import { useTileServiceLayer } from "@/hooks/use-tileservice";
import { MapInstance } from "@/types";
import { useEffect } from "react";

export const TileServiceLayer = ({
  map,
  tileServiceURL,
  onFitToBounds,
  onLoadingChange,
}: {
  map: MapInstance;
  tileServiceURL: string;
  /** Override the default fitBounds-to-imagery behavior when tileJSON loads. */
  onFitToBounds?: () => void;
  /** Notified as the raster tiles start/finish loading (for a spinner). */
  onLoadingChange?: (loading: boolean) => void;
}) => {
  const { loading } = useTileServiceLayer({
    map,
    tileServiceURL,
    addLayerToMap: true,
    onFitToBounds,
  });

  useEffect(() => {
    onLoadingChange?.(loading);
  }, [loading, onLoadingChange]);

  return null;
};
