import { Alert } from "@/components/ui/alert";
import { HelpText, Input, Select } from "@/components/ui/form";
import {
  INPUT_TYPES,
  SHOELACE_SELECT_SIZES,
  SHOELACE_SIZES,
  TileServiceType,
} from "@/enums";
import { getTileServerRegex } from "@/utils";

const TILE_SERVICE_TYPES: {
  name: string;
  suffix: string;
  value: TileServiceType;
}[] = [
  {
    name: "XYZ Tile Server",
    suffix: "Standard web mapping tiles.",
    value: TileServiceType.XYZ,
  },
  {
    name: "TMS Tile Server",
    suffix: "TileMapService, inverted Y axis.",
    value: TileServiceType.TMS,
  },
  {
    name: "TileJSON",
    suffix: "Provides metadata including bounds and zoom levels.",
    value: TileServiceType.TILEJSON,
  },
];

export const XYZTileServerInput = ({
  tileServerURL,
  setTileServerURL,
  isValid,
  validationStateUpdateCallback,
  labelWithTooltip = true,
  showBorder = true,
  size,
  tileServiceType,
  setTileServiceType,
}: {
  tileServerURL: string;
  setTileServerURL: (url: string) => void;
  isValid: { valid: boolean; message: string };
  labelWithTooltip?: boolean;
  showBorder?: boolean;
  size?: SHOELACE_SIZES;
  validationStateUpdateCallback?: (validationState: {
    valid: boolean;
    message: string;
  }) => void;
  pattern?: string;
  tileServiceType: TileServiceType;
  setTileServiceType: (tileServiceType: TileServiceType) => void;
}) => {
  return (
    <div className="flex flex-col gap-2">
      <Select
        label="Tile Service Type"
        options={TILE_SERVICE_TYPES}
        handleChange={(e) => {
          const newTileServiceType = e as TileServiceType;
          setTileServiceType(newTileServiceType);
        }}
        defaultValue={tileServiceType}
        size={size as unknown as SHOELACE_SELECT_SIZES}
      />
      <Input
        label={`${tileServiceType} ${tileServiceType !== TileServiceType.TILEJSON ? "Tile Server" : ""} URL`}
        labelWithTooltip={labelWithTooltip}
        value={tileServerURL}
        toolTipContent={
          tileServiceType === TileServiceType.TILEJSON
            ? "Provide the URL to the TileJSON metadata file. For example, use a TileJSON link from a supported service."
            : "Provide the URL template for your XYZ or TMS tile server. For example, use the TMS link from OpenAerialMap (OAM) or a custom URL."
        }
        placeholder={
          tileServiceType === TileServiceType.TILEJSON
            ? "e.g. https://example.com/tiles.json"
            : tileServiceType === TileServiceType.XYZ
              ? "e.g. https://tiles.example.com/{z}/{x}/{y}.png"
              : "e.g. https://tiles.example.com/{z}/{x}/{-y}.png"
        }
        showBorder={showBorder}
        pattern={getTileServerRegex(tileServiceType).source}
        handleInput={(e) => setTileServerURL(e.target.value)}
        type={INPUT_TYPES.URL}
        validationStateUpdateCallback={validationStateUpdateCallback}
        isValid={tileServerURL.length > 0 && isValid.valid}
        size={size}
      />
      {tileServerURL.length > 0 && !isValid.valid && (
        <HelpText>
          <span className="text-primary">{isValid.message}</span>
        </HelpText>
      )}
      <Alert>
        <span className="text-wrap text-xs">
          Ensure your imagery URL has CORS enabled and adheres to the{" "}
          <a
            href="https://github.com/hotosm/fair?tab=readme-ov-file#imagery-license"
            target="_blank"
            className="text-primary underline"
          >
            license requirements
          </a>
          .
        </span>
      </Alert>
    </div>
  );
};
