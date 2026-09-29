import { useEffect } from "react";
import { RasterTileSource } from "maplibre-gl";
import { MapComponent } from "@/components/map";
import { TMS_SOURCE_ID } from "@/config";
import { useMapInstance } from "@/hooks/use-map-instance";
import { ImagerySelection } from "@/features/try-fair/types/imagery-types";
import { CountryResult } from "@/features/try-fair/api/hot-imagery";
import { CountryBadge } from "@/features/try-fair/components/model-picker/model-picker-badges";
import { RepeatIcon } from "@/components/ui/icons/repeat-icon";

type ImageryPreviewCardProps = {
  selectedImagery: ImagerySelection;
  imageryTitle: string;
  imagerySourceLabel: string;
  imageryCountry: CountryResult | null;
  onChangeImagery: () => void;
};

/**
 * An inline map preview of the selected imagery rendered inside the model picker using MapComponent.
 */
export const ImageryPreviewCard = ({
  selectedImagery,
  imageryTitle,
  imagerySourceLabel,
  imageryCountry,
  onChangeImagery,
}: ImageryPreviewCardProps) => {
  const { mapContainerRef, map } = useMapInstance(false, false);

  useEffect(() => {
    if (!map || !selectedImagery.bounds) return;
    const bounds = selectedImagery.bounds;

    const frameImagery = () =>
      map.fitBounds(bounds, { padding: 20, maxZoom: 18, duration: 0 });
    frameImagery();

    // Cap the map's minimum zoom at the imagery's own minzoom so users can't
    // zoom out past where the bounded TileJSON raster has tiles — below it the
    // imagery simply disappears. setMinZoom also lifts the current view up if the
    // initial fit landed below it, so a large scene never shows blank. The
    // minzoom is only known once the imagery's TileJSON has resolved.
    let applied = false;
    const lockMinZoom = (event: {
      sourceId?: string;
      isSourceLoaded?: boolean;
    }) => {
      if (applied || event.sourceId !== TMS_SOURCE_ID || !event.isSourceLoaded)
        return;
      const source = map.getSource(TMS_SOURCE_ID) as
        | RasterTileSource
        | undefined;
      if (typeof source?.minzoom !== "number") return;
      applied = true;
      map.setMinZoom(source.minzoom);
      frameImagery();
    };
    map.on("sourcedata", lockMinZoom);
    return () => {
      map.off("sourcedata", lockMinZoom);
      if (map.getStyle()) map.setMinZoom(undefined);
    };
  }, [map, selectedImagery.bounds]);

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden border border-gray-border">
      {/* Overlay: imagery info card (top-left) */}
      <div className="absolute top-3 left-3 z-10 bg-[#FFFFFFCC] backdrop-blur-sm rounded-lg px-3 py-2 shadow-sm max-w-[250px]">
        <p className="text-dark text-xs font-medium leading-tight truncate">
          {imageryTitle}
        </p>
        <p className="text-grey text-xs leading-tight mt-0.5">
          Source: {imagerySourceLabel}
        </p>
        {imageryCountry && (
          <div className="mt-1">
            <CountryBadge
              country={imageryCountry.country}
              code={imageryCountry.countryCode}
              showBg={false}
            />
          </div>
        )}
      </div>

      {/* Overlay: Change button (top-right) */}
      <button
        type="button"
        onClick={onChangeImagery}
        className="absolute top-3 right-3 z-10 flex items-center gap-1.5 bg-[#2C3038CC] text-white text-xs font-medium rounded-md px-3 py-1.5 shadow-sm "
      >
        <RepeatIcon />
        Change
      </button>

      <MapComponent
        map={map}
        mapContainerRef={mapContainerRef}
        tileServiceURL={selectedImagery.tileUrl}
        zoomControls={false}
      />
    </div>
  );
};
