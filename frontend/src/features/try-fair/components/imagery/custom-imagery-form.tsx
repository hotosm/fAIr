import { useMemo, useState } from "react";
import { SHOELACE_SIZES, TileServiceType } from "@/enums";
import { BBOX } from "@/types";
import { getTileServerRegex } from "@/utils";
import { XYZTileServerInput } from "@/components/shared/form/xyz-tile-server-input";
import { useMapInstance } from "@/hooks/use-map-instance";
import { MapComponent } from "@/components/map";
import { MapIcon } from "@/components/ui/icons";

export type AppliedCustomImagery = {
  tileUrl: string;
  tileServiceType: TileServiceType;
  bounds: BBOX | null;
};

/**
 * Custom Imagery tab of the imagery/location dialog: tile service type + tile
 * server URL (via the shared XYZTileServerInput), and Apply. The map below
 * previews the tiles live as soon as the URL is valid (MapComponent's
 * TileServiceLayer adds the layer and frames the imagery from its TileJSON).
 * Apply commits the imagery so the main map uses it.
 */
export const CustomImageryForm = ({
  applied,
  onApply,
}: {
  applied: AppliedCustomImagery | null;
  onApply: (imagery: AppliedCustomImagery) => void;
}) => {
  const { mapContainerRef, map } = useMapInstance(false, false);

  const [tileServiceType, setTileServiceType] = useState<TileServiceType>(
    applied?.tileServiceType ?? TileServiceType.XYZ,
  );
  const [tileServerURL, setTileServerURL] = useState<string>(
    applied?.tileUrl ?? "",
  );
  // Remount key: bump it to reset the (uncontrolled) tile-type Select on clear.
  const [formKey, setFormKey] = useState(0);

  // Validity is derived straight from the URL + type, so it updates on every
  // keystroke (the previous approach read the web component's validity one tick
  // late, which made the preview feel unresponsive until the field was cleared).
  const isValid = useMemo(() => {
    const url = tileServerURL.trim();
    const valid =
      url.length > 0 && getTileServerRegex(tileServiceType).test(url);
    return {
      valid,
      message:
        valid || url.length === 0 ? "" : "Enter a valid tile server URL.",
    };
  }, [tileServerURL, tileServiceType]);

  const clearForm = () => {
    setTileServerURL("");
    setTileServiceType(TileServiceType.XYZ);
    setFormKey((k) => k + 1);
  };

  const handleApply = () => {
    if (!isValid.valid) return;
    onApply({ tileUrl: tileServerURL, tileServiceType, bounds: null });
    clearForm();
  };

  return (
    <div className="flex flex-col gap-2 h-full">
      <XYZTileServerInput
        key={formKey}
        tileServerURL={tileServerURL}
        setTileServerURL={setTileServerURL}
        tileServiceType={tileServiceType}
        setTileServiceType={setTileServiceType}
        isValid={isValid}
        variant="vertical"
        size={SHOELACE_SIZES.MEDIUM}
        buttonOnclick={handleApply}
        showButton
        useAlert={false}
      />

      {/* The preview map stays mounted; the empty state overlays it until the
          URL is valid, so the map instance is never torn down. */}
      <div className="relative flex-1 min-h-[620px] rounded-[18px] overflow-hidden w-full z-10">
        <MapComponent
          map={map}
          mapContainerRef={mapContainerRef}
          tileServiceURL={isValid.valid ? tileServerURL : undefined}
          zoomControls={false}
        />
        {!isValid.valid && (
          <div className="absolute inset-0">
            <CustomImageEmptyState />
          </div>
        )}
      </div>
    </div>
  );
};

const CustomImageEmptyState = () => (
  <div className="bg-[#E9E9E9] flex-col h-full rounded-lg flex justify-center space-y-2 items-center">
    <MapIcon className="size-6" />
    <h4 className="text-sm font-medium">No Imagery to preview</h4>
    <p className="text-dark text-xs">
      Once all fields are populated correctly, the imagery will be displayed
      here
    </p>
  </div>
);
