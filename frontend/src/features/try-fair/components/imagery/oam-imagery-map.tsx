import { useEffect, useRef, useState } from "react";
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
import { SearchIcon } from "@/components/ui/icons";
import { ToolTip } from "@/components/ui/tooltip";
import Spinner from "@/components/ui/spinner/spinner";

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
  /** Fired when the map's search button is clicked to toggle location search. */
  onToggleSearch?: () => void;
  searchIconTooltipContent: string;
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
  onToggleSearch,
  searchIconTooltipContent,
}: Props) => {
  const { map, mapContainerRef } = useImageryModalMap();
  const [tilesLoading, setTilesLoading] = useState(true);

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

  // Track density tile loading via MapLibre's sourcedata / idle events.
  useEffect(() => {
    if (!map) return;

    const handleSourceData = () => {
      if (typeof map.areTilesLoaded === "function" && !map.areTilesLoaded()) {
        setTilesLoading(true);
      }
    };
    const handleIdle = () => {
      setTilesLoading(false);
    };

    map.on("sourcedata", handleSourceData);
    map.on("idle", handleIdle);

    // If the map is already idle when this effect runs, clear loading.
    if (
      typeof map.areTilesLoaded === "function" ? map.areTilesLoaded() : true
    ) {
      setTilesLoading(false);
    }

    return () => {
      map.off("sourcedata", handleSourceData);
      map.off("idle", handleIdle);
    };
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
    <div className="relative w-full h-full overflow-hidden">
      <MapComponent
        basemaps
        map={map}
        mapContainerRef={mapContainerRef}
        zoomControls
      >
        <div className="absolute top-[25%] md:top-[18%] right-3 map-elements-z-index flex flex-col gap-y-4">
          <ToolTip content={searchIconTooltipContent}>
            <button
              type="button"
              aria-label="Toggle location search"
              onClick={onToggleSearch}
              className="bg-white p-2   hover:bg-off-white"
            >
              <SearchIcon className="size-5" />
            </button>
          </ToolTip>
        </div>
      </MapComponent>

      {/* Loading overlay for density tiles */}
      {tilesLoading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
          <div className="bg-white/80 backdrop-blur-sm rounded-lg px-4 py-3 flex items-center gap-2.5 shadow-md pointer-events-auto">
            <Spinner
              style={
                {
                  fontSize: "1.5rem",
                } as Record<string, string>
              }
            />
            <span className="text-dark text-base font-medium">
              Loading imagery coverage…
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
