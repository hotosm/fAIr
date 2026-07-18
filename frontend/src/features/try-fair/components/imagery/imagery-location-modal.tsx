import { Dialog } from "@/components/ui/dialog";
import { Map as MapLibreMap } from "maplibre-gl";

import { SHOELACE_SIZES } from "@/enums";
import { BBOX } from "@/types";
import { ImagerySourceToggle } from "@/features/try-fair/components/imagery/choose-imagery-source";
import { useEffect, useRef, useState } from "react";
import { AppliedCustomImagery, CustomImageryForm } from "./custom-imagery-form";
import { OamImageryMap, SelectedCell } from "./oam-imagery-map";
import {
  geocodeLocation,
  getImageryTileUrl,
  OAMImageryItem,
  searchImagery,
} from "../../api/hot-imagery";
import { Button } from "@/components/ui/button";
import { OAMImageryPanel } from "./imagery-search-panel";
import { ImagerySelection } from "../../types/imagery-types";
import { Divider } from "@/components/ui/divider";
import { MapIcon } from "@/components/ui/icons";

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
}: {
  isOpened: boolean;
  closeDialog: () => void;
  onApply: (selection: ImagerySelection) => void;
}) => {
  const [source, setSource] = useState<ImagerySource>(
    ImagerySource.OPEN_AERIAL_MAP,
  );
  const [selectedCell, setSelectedCell] = useState<SelectedCell | null>(null);
  const [cellImages, setCellImages] = useState<OAMImageryItem[]>([]);
  const [cellLoading, setCellLoading] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<OAMImageryItem | null>(null);
  const [searching, setSearching] = useState<boolean>(false);
  const [appliedCustomImagery, setAppliedCustomImagery] =
    useState<AppliedCustomImagery | null>(null);

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
      tileUrl: getImageryTileUrl(selectedItem.id, selectedItem.assetName),
      bounds: selectedItem.bbox,
    });
    closeDialog();
  };

  const handleApplyCustomImagery = (imagery: AppliedCustomImagery) => {
    setAppliedCustomImagery(imagery);
    onApply({
      source: ImagerySource.CUSTOM,
      tileUrl: imagery.tileUrl,
      tileServiceType: imagery.tileServiceType,
      bounds: imagery.bounds,
    });
  };

  const handleSearch = async (query: string) => {
    if (!mapRef.current || searching) return;
    setSearching(true);
    try {
      const result = await geocodeLocation(query);
      if (result) {
        mapRef.current.fitBounds(result.bbox as BBOX, { padding: 40 });
      }
    } finally {
      setSearching(false);
    }
  };

  const isOAM = source === ImagerySource.OPEN_AERIAL_MAP;
  return (
    <Dialog
      label="Imagery to map"
      isOpened={isOpened}
      closeDialog={closeDialog}
      size={isOAM ? SHOELACE_SIZES.LARGE : SHOELACE_SIZES.MEDIUM}
    >
      {isOpened && (
        <div className="flex flex-col gap-4">
          <ImagerySourceToggle value={source} onChange={setSource} />
          {!isOAM && <Divider />}

          <div className="relative w-full h-[620px] rounded-lg overflow-hidden">
            {isOAM ? (
              <>
                <OamImageryMap
                  selectedItem={selectedItem}
                  onCellSelect={setSelectedCell}
                  onMapReady={(map) => {
                    mapRef.current = map;
                  }}
                />

                <OAMImageryPanel
                  cellSelected={!!selectedCell}
                  cellCount={selectedCell?.count ?? 0}
                  images={cellImages}
                  loading={cellLoading}
                  selectedItem={selectedItem}
                  onSelect={setSelectedItem}
                  onSearch={handleSearch}
                  searching={searching}
                />

                <div className="absolute bottom-4 right-4 z-20">
                  <Button
                    size="medium"
                    disabled={!selectedItem}
                    onClick={handleApplyOAMItem}
                  >
                    Apply
                  </Button>
                </div>
              </>
            ) : (
              <>
                <CustomImageryForm
                  applied={appliedCustomImagery}
                  onApply={handleApplyCustomImagery}
                />

                {!appliedCustomImagery && (
                  <div className="bg-[#E9E9E9] flex-col h-4/5 mt-4 rounded-lg flex justify-center space-y-2 items-center">
                    <MapIcon className="size-6" />
                    <h4 className="text-sm font-medium">
                      No Imagery to preview
                    </h4>
                    <p className="text-dark text-xs">
                      Once all field are populated correctly, the imagery will
                      be displayed here
                    </p>
                  </div>
                )}

                {/* <CustomImageryMap
                  tileUrl={appliedCustomImagery?.tileUrl ?? null}
                  scheme={
                    appliedCustomImagery?.tileServiceType === TileServiceType.TMS
                      ? "tms"
                      : "xyz"
                  }
                /> */}
              </>
            )}
          </div>
        </div>
      )}
    </Dialog>
  );
};
