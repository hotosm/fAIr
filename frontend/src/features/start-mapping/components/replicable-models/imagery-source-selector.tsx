import { PredictionImagerySource } from "@/enums/start-mapping";
import { useMemo, useState } from "react";
import { ButtonVariant, SHOELACE_SIZES, TileServiceType } from "@/enums";
import { Button } from "@/components/ui/button";
import { RadioGroup } from "@/components/ui/form/radio-group/radio-group";
import { XYZTileServerInput } from "@/components/shared/form/xyz-tile-server-input";
import { START_MAPPING_PAGE_CONTENT } from "@/constants";
import { FormLabel } from "@/components/ui/form";
import { Divider } from "@/components/ui/divider";
import { CloseIcon } from "@/components/ui/icons";
import { OPENAERIALMAP_MOSAIC_TILES_URL } from "@/config";

const PredictionImagerySources: Array<{
  value: PredictionImagerySource;
  label: string;
  url?: string;
  tooltip: string;
}> = [
  {
    value: PredictionImagerySource.ModelDefault,
    label: "Model Default",
    url: "",
    tooltip: "Default imagery for the model.",
  },
  {
    value: PredictionImagerySource.CustomImagery,
    label: "Custom Imagery",
    tooltip: "Use a custom XYZ/TMS tile server URL.",
  },
  {
    value: PredictionImagerySource.Kontour,
    label: "OpenAerialMap Mosaic",
    url: OPENAERIALMAP_MOSAIC_TILES_URL,
    tooltip: "All OpenAerialMap images in one mosaic layer, by Kontur.io.",
  },
];

export const ImagerySourceSelector = ({
  setPredictionImagerySource,
  predictionImagerySource,
  modelDefaultImageryURL,
  isMobile,
  onDropdownHide,
  tileServerURL,
  tileServiceType,
  tileServiceTypeValidity,
  setTileserverURL,
  loading,
  setTileServiceTypeValidity,
  setTileServiceType,
}: {
  setPredictionImagerySource: (value: PredictionImagerySource) => void;
  predictionImagerySource: PredictionImagerySource;
  modelDefaultImageryURL: string | undefined;
  isMobile?: boolean;
  onDropdownHide: () => void;
  tileServerURL: string;
  tileServiceType: TileServiceType;
  tileServiceTypeValidity: {
    valid: boolean;
    message: string;
  };
  setTileServiceTypeValidity: React.Dispatch<
    React.SetStateAction<{
      valid: boolean;
      message: string;
    }>
  >;
  setTileserverURL: React.Dispatch<React.SetStateAction<string>>;
  loading: boolean;
  setTileServiceType: React.Dispatch<React.SetStateAction<TileServiceType>>;
}) => {
  const [localPredictionImagerySource, setLocalPredictionImagerySource] =
    useState<PredictionImagerySource>(predictionImagerySource);
  const [localTileServiceType, setLocalTileServiceType] =
    useState<TileServiceType>(tileServiceType);

  const [localTileServerURL, setLocalTileServerURL] =
    useState<string>(tileServerURL);

  const [localTileServiceTypeValidity, setLocalTileServiceTypeValidity] =
    useState<{
      valid: boolean;
      message: string;
    }>(tileServiceTypeValidity);
  const PredictionImagerySourceURLs = useMemo(
    () => ({
      [PredictionImagerySource.CustomImagery]: localTileServerURL,
      [PredictionImagerySource.ModelDefault]: modelDefaultImageryURL,
      [PredictionImagerySource.Kontour]: OPENAERIALMAP_MOSAIC_TILES_URL,
    }),
    [localTileServerURL, modelDefaultImageryURL],
  );

  const handleApply = () => {
    setPredictionImagerySource(localPredictionImagerySource);
    setTileServiceType(localTileServiceType);
    setTileserverURL(
      (
        PredictionImagerySourceURLs as Record<
          PredictionImagerySource,
          string | undefined
        >
      )[localPredictionImagerySource] || "",
    );
    setTileServiceTypeValidity(localTileServiceTypeValidity);
    if (!loading) onDropdownHide();
  };

  return (
    <div
      className={`bg-white ${isMobile ? "w-full" : "w-[350px] shadow-lg rounded-xl border border-gray-border "} p-4 max-h-[400px] gap-y-4 overflow-y-auto flex flex-col scrollable`}
    >
      {!isMobile && (
        <div>
          <FormLabel
            withTooltip
            label="Prediction Imagery"
            toolTipContent="Select the imagery source to be used for predictions."
          />
          <small className="text-xs text-grey">
            Changes will be applied to the map when you click Apply.
          </small>
          <Divider />
        </div>
      )}
      <RadioGroup
        options={PredictionImagerySources}
        onChange={(e) => {
          setLocalPredictionImagerySource(e as PredictionImagerySource);
          /**
           *  Reset the local tile server URL when the imagery source changes,
           *  except when switching to Custom Imagery, where the URL is set by the user.
           */
          if (e !== PredictionImagerySource.CustomImagery) {
            setLocalTileServerURL("");
          }
        }}
        value={localPredictionImagerySource}
        withTooltip
      />
      {localPredictionImagerySource ===
        PredictionImagerySource.CustomImagery && (
        <div className="flex flex-col gap-y-2 mt-2">
          <XYZTileServerInput
            tileServiceType={localTileServiceType}
            isValid={localTileServiceTypeValidity}
            setTileServerURL={(e) => setLocalTileServerURL(e)}
            tileServerURL={localTileServerURL}
            validationStateUpdateCallback={setLocalTileServiceTypeValidity}
            setTileServiceType={setLocalTileServiceType}
            size={SHOELACE_SIZES.SMALL}
          />
        </div>
      )}
      {localPredictionImagerySource !==
        PredictionImagerySource.ModelDefault && (
        <small className="text-xs text-grey">
          {START_MAPPING_PAGE_CONTENT.replicableModel.info}
        </small>
      )}
      <Divider />
      <div className="flex justify-between items-center gap-x-2">
        <Button
          size={SHOELACE_SIZES.SMALL}
          disabled={
            (localPredictionImagerySource ===
              PredictionImagerySource.CustomImagery &&
              !localTileServiceTypeValidity.valid) ||
            loading
          }
          onClick={handleApply}
        >
          {loading
            ? START_MAPPING_PAGE_CONTENT.replicableModel.loading
            : START_MAPPING_PAGE_CONTENT.replicableModel.apply}
        </Button>
        <Button
          size={SHOELACE_SIZES.SMALL}
          disabled={loading}
          onClick={onDropdownHide}
          variant={ButtonVariant.DEFAULT}
          className="max-w-fit"
        >
          <CloseIcon className="icon" />
        </Button>
      </div>
    </div>
  );
};
