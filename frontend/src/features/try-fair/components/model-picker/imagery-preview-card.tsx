import { useEffect } from "react";
import { MapComponent } from "@/components/map";
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
    if (map && selectedImagery.bounds) {
      map.fitBounds(selectedImagery.bounds, {
        padding: 20,
        maxZoom: 18,
        duration: 0,
      });
    }
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
