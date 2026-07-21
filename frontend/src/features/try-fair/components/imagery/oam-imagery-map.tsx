import { useEffect, useRef } from "react";
import { Map as MapLibreMap, MapMouseEvent } from "maplibre-gl";
import { MapComponent } from "@/components/map";
import { OAMImageryItem } from "@/features/try-fair/api/hot-imagery";
import { useImageryModalMap } from "@/features/try-fair/hooks/use-imagery-modal-map";
import {
  addImageryLayers,
  clearImageryPreview,
  highlightCell,
  readCellAt,
  showImageryPreview,
  SelectedCell,
} from "./imagery-modal-map.layers";

export type { SelectedCell };

type Props = {
  /** Cell to outline in red, or null. Driven by the dialog so closing the
   *  panel or picking an image clears it. */
  highlightGeometry: GeoJSON.Geometry | null;
  /** OAM image whose tiles should be previewed on the map. */
  selectedItem: OAMImageryItem | null;
  /** Fired when a density grid cell is clicked (or cleared by clicking away). */
  onCellSelect: (cell: SelectedCell | null) => void;
  /** Handed the map once ready, e.g. so the dialog can drive fitBounds on search. */
  onMapReady?: (map: MapLibreMap) => void;
};

/**
 * The OpenAerialMap tab's map: the imagery.hotosm.org coverage grid, each cell
 * labelled with its image count. Clicking a cell reports it upward so the dialog
 * can list the imagery inside; the selected image is previewed as raster tiles.
 *
 * MapLibre plumbing lives in ./imagery-modal-map.layers.ts, so each effect
 * below reads as one action.
 */
export const OamImageryMap = ({
  highlightGeometry,
  selectedItem,
  onCellSelect,
  onMapReady,
}: Props) => {
  const { map, mapContainerRef } = useImageryModalMap();

  // Latest callback read inside the long-lived click handler, kept in a ref so
  // the handler is bound once without re-binding on every render.
  const onCellSelectRef = useRef(onCellSelect);
  onCellSelectRef.current = onCellSelect;

  // Once ready: add the density grid + labels, and wire click-to-select.
  useEffect(() => {
    if (!map) return;
    addImageryLayers(map);
    onMapReady?.(map);

    const handleClick = (e: MapMouseEvent) => {
      onCellSelectRef.current(readCellAt(map, e.point));
    };
    map.on("click", handleClick);
    return () => {
      map.off("click", handleClick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  // Red highlight follows the dialog's selection.
  useEffect(() => {
    if (map) highlightCell(map, highlightGeometry);
  }, [map, highlightGeometry]);

  // Preview (and frame) the selected image, or clear it.
  useEffect(() => {
    if (!map) return;
    if (selectedItem) showImageryPreview(map, selectedItem);
    else clearImageryPreview(map);
  }, [map, selectedItem]);

  return (
    <MapComponent map={map} mapContainerRef={mapContainerRef} zoomControls />
  );
};
