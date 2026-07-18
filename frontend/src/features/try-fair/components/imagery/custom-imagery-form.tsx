import { useState } from "react";
import { SHOELACE_SIZES, TileServiceType } from "@/enums";
import { BBOX } from "@/types";
import { XYZTileServerInput } from "@/components/shared/form/xyz-tile-server-input";

export type AppliedCustomImagery = {
  tileUrl: string;
  tileServiceType: TileServiceType;
  bounds: BBOX | null;
};

/**
 * Custom Imagery tab of the imagery/location dialog: tile service type + tile
 * server URL (via the shared XYZTileServerInput), a CORS/license note, and
 * Apply. Applying previews the tiles on the shared imagery/location map below.
 */
export const CustomImageryForm = ({
  applied,
  onApply,
}: {
  applied: AppliedCustomImagery | null;
  onApply: (imagery: AppliedCustomImagery) => void;
}) => {
  const [tileServiceType, setTileServiceType] = useState<TileServiceType>(
    applied?.tileServiceType ?? TileServiceType.XYZ,
  );
  const [tileServerURL, setTileServerURL] = useState<string>(
    applied?.tileUrl ?? "",
  );
  const [isValid, setIsValid] = useState<{ valid: boolean; message: string }>({
    valid: false,
    message: "",
  });

  const handleApply = () => {
    if (!isValid.valid) return;
    onApply({ tileUrl: tileServerURL, tileServiceType, bounds: null });
  };

  return (
    <div className="flex flex-col gap-4">
      <XYZTileServerInput
        tileServerURL={tileServerURL}
        setTileServerURL={setTileServerURL}
        tileServiceType={tileServiceType}
        setTileServiceType={setTileServiceType}
        isValid={isValid}
        variant="vertical"
        validationStateUpdateCallback={setIsValid}
        size={SHOELACE_SIZES.MEDIUM}
        buttonOnclick={handleApply}
        showButton
        useAlert={false}
      />
    </div>
  );
};
