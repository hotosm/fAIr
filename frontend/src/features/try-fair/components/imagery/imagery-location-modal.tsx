import { Dialog } from "@/components/ui/dialog";
import { Map as MapLibreMap } from "maplibre-gl";

import { SHOELACE_SIZES } from "@/enums";
import { BBOX } from "@/types";
import { ImagerySourceToggle } from "@/features/try-fair/components/imagery/choose-imagery-source";
import { useEffect, useRef, useState } from "react";
import {
  AppliedCustomImagery,
  CustomImageryForm,
} from "@/features/try-fair/components/imagery/custom-imagery-form";
import {
  OamImageryMap,
  SelectedCell,
} from "@/features/try-fair/components/imagery/oam-imagery-map";
import {
  GeocodeResult,
  getImageryTileJSONUrl,
  OAMImageryItem,
  searchImagery,
} from "@/features/try-fair/api/hot-imagery";
import { OAMImageryPanel } from "@/features/try-fair/components/imagery/imagery-search-panel";
import { ImagerySelection } from "@/features/try-fair/types/imagery-types";
import { Divider } from "@/components/ui/divider";
import { cn } from "@/utils";
import { LocationSearch } from "./location-search";
import { ChevronDownIcon } from "@/components/ui/icons";

export enum ImagerySource {
  OPEN_AERIAL_MAP = "openAerialMap",
  CUSTOM = "custom",
}

/**
 * "Imagery/location to map" dialog. Lets the user pick imagery either by
 * browsing OpenAerialMap (search + footprints + preview, backed by
 * imagery.hotosm.org) or by providing a custom XYZ/TMS tile server URL.
 */
export const ImageryLocationDialog = ({
  isOpened,
  closeDialog,
  onApply,
  onBackToModelPicker,
}: {
  isOpened: boolean;
  closeDialog: () => void;
  onApply: (selection: ImagerySelection) => void;
  onBackToModelPicker?: () => void;
}) => {
  const [source, setSource] = useState<ImagerySource>(
    ImagerySource.OPEN_AERIAL_MAP,
  );
  const [selectedCell, setSelectedCell] = useState<SelectedCell | null>(null);
  const [cellImages, setCellImages] = useState<OAMImageryItem[]>([]);
  const [cellLoading, setCellLoading] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<OAMImageryItem | null>(null);
  const [appliedCustomImagery, setAppliedCustomImagery] =
    useState<AppliedCustomImagery | null>(null);
  const [showSearch, setShowSearch] = useState<boolean>(true);
  const mapRef = useRef<MapLibreMap | null>(null);
  const searchAbortRef = useRef<AbortController | null>(null);

  // Fetch the imagery inside the selected grid cell.
  useEffect(() => {
    searchAbortRef.current?.abort();
    setSelectedItem(null);
    if (!selectedCell) {
      setCellImages([]);
      return;
    }
    const controller = new AbortController();
    searchAbortRef.current = controller;
    setCellLoading(true);
    searchImagery({ bbox: selectedCell.bbox, signal: controller.signal })
      .then((items) => {
        if (!controller.signal.aborted) setCellImages(items);
      })
      .catch(() => {
        if (!controller.signal.aborted) setCellImages([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) setCellLoading(false);
      });
    return () => controller.abort();
  }, [selectedCell]);

  const handleApplyOAMItem = () => {
    if (!selectedItem) return;
    onApply({
      source: ImagerySource.OPEN_AERIAL_MAP,
      item: selectedItem,
      // The map renders this URL, so it must be the bounded TileJSON — MapLibre
      // reads its bounds/minzoom and only requests tiles that exist. The bare
      // XYZ template is unbounded and floods the map with 404s (tiles outside
      // the image footprint), leaving it blank. The backend still receives the
      // XYZ template separately via `predictionImageUri`.
      tileUrl: getImageryTileJSONUrl(selectedItem.id, selectedItem.assetName),
      bounds: selectedItem.bbox,
    });
    if (onBackToModelPicker) {
      onBackToModelPicker();
    } else {
      closeDialog();
    }
  };

  const handleApplyCustomImagery = (imagery: AppliedCustomImagery) => {
    setAppliedCustomImagery(imagery);
    onApply({
      source: ImagerySource.CUSTOM,
      tileUrl: imagery.tileUrl,
      tileServiceType: imagery.tileServiceType,
      bounds: imagery.bounds,
    });
    onBackToModelPicker?.();
  };
  // Frame a picked search suggestion.
  const handlePick = (result: GeocodeResult) => {
    mapRef.current?.fitBounds(result.bbox as BBOX, { padding: 40 });
  };
  // Clearing the search returns to the world coverage view and clears/closes the panel.
  const handleClearSearch = () => {
    setSelectedCell(null);
    setSelectedItem(null);
    mapRef.current?.flyTo({ center: [0, 20], zoom: 1.4 });
  };
  // const {isLargeScreen} = useScreenSize()
  const isOAM = source === ImagerySource.OPEN_AERIAL_MAP;
  return (
    <Dialog
      label="Imagery to map"
      isOpened={isOpened}
      closeDialog={closeDialog}
      size={SHOELACE_SIZES.LARGE}
    >
      {isOpened && (
        <div className="flex flex-col gap-4">
          {onBackToModelPicker && (
            <button
              type="button"
              onClick={onBackToModelPicker}
              className="text-primary mt-1 mb-3 flex items-center gap-1 text-sm font-medium"
            >
              <ChevronDownIcon className="size-3 rotate-90" />
              Back
            </button>
          )}
          <p className="text-grey text-sm w-full md:w-1/2 -mt-6 shrink-0">
            Select an imagery source to preview and map your location. You can
            choose pre-existing imagery from OpenAerialMap or enter a custom
            tile server URL.
          </p>
          <div className="shrink-0">
            <ImagerySourceToggle value={source} onChange={setSource} />
            {!isOAM && <Divider />}
          </div>

          <div
            className="relative w-full rounded-lg overflow-hidden"
            style={{ height: "min(620px, calc(92vh - 220px))" }}
          >
            <div className={cn("absolute inset-0", !isOAM && "invisible")}>
              <OamImageryMap
                highlightGeometry={
                  selectedCell && !selectedItem ? selectedCell.geometry : null
                }
                selectedItem={selectedItem}
                onCellSelect={setSelectedCell}
                searchIconTooltipContent={
                  showSearch ? "Hide search bar" : "Show search bar"
                }
                onMapReady={(map) => {
                  mapRef.current = map;
                }}
                onToggleSearch={() => setShowSearch((prev) => !prev)}
              />
            </div>
            {isOAM ? (
              <>
                <div
                  className={cn(
                    "absolute top-4 left-1/2 -translate-x-1/2 z-30 transition-opacity duration-200",
                    !showSearch && "opacity-0 pointer-events-none invisible",
                  )}
                >
                  <LocationSearch
                    onPick={handlePick}
                    onClear={handleClearSearch}
                    onClose={() => setShowSearch(false)}
                  />
                </div>

                <OAMImageryPanel
                  cellSelected={!!selectedCell}
                  images={cellImages}
                  loading={cellLoading}
                  selectedItem={selectedItem}
                  onSelect={setSelectedItem}
                  onClose={() => setSelectedCell(null)}
                  handleApplyOAMItem={handleApplyOAMItem}
                />
              </>
            ) : (
              <div className="absolute inset-0 bg-white">
                <CustomImageryForm
                  applied={appliedCustomImagery}
                  onApply={handleApplyCustomImagery}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </Dialog>
  );
};
