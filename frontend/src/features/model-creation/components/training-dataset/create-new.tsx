import { Input } from "@/components/ui/form";
import { MODELS_CONTENT } from "@/constants";
import { useCallback, useEffect, useState } from "react";
import {
  FORM_VALIDATION_CONFIG,
  MODEL_CREATION_FORM_NAME,
  useModelsContext,
} from "@/app/providers/models-provider";
import { MapIcon } from "@/components/ui/icons";
import { useMapInstance } from "@/hooks/use-map-instance";
import { MapComponent } from "@/components/map";
import { Spinner } from "@/components/ui/spinner";
import { XYZTileServerInput } from "@/components/shared/form/xyz-tile-server-input";
import { Button } from "@/components/ui/button";
import { ButtonVariant, TileServiceType } from "@/enums";
import { useTileservice } from "@/hooks/use-tileservice";

const PREVIEW_TMS_SOURCE_ID = "preview-tms-source";
const PREVIEW_TMS_LAYER_ID = "preview-tms-layer";

const validateDatasetName = (name: string) => {
  const min =
    FORM_VALIDATION_CONFIG[MODEL_CREATION_FORM_NAME.DATASET_NAME].minLength;
  const max =
    FORM_VALIDATION_CONFIG[MODEL_CREATION_FORM_NAME.DATASET_NAME].maxLength;

  if (name.length < min)
    return { valid: false, message: `Must be at least ${min} characters.` };
  if (name.length > max)
    return { valid: false, message: `Must not exceed ${max} characters.` };

  return { valid: true, message: "" };
};

const CreateNewTrainingDatasetForm = () => {
  const { formData, createNewTrainingDatasetMutation, handleChange } =
    useModelsContext();
  const { mapContainerRef, map } = useMapInstance();

  const [error, setError] = useState<string>("");
  const {
    tileServiceType,
    setTileServiceType,
    tileserverURL,
    setTileserverURL,
    tileJSONMetadata,
    tileServiceTypeValidity,
    setTileServiceTypeValidity,
    isOpenAerialMap,
    sourceURL,
    loading,
    setLoading,
  } = useTileservice(formData.tileserviceType, formData.tmsURL);

  const [trainingdatasetName, setTrainingDatasetName] = useState<string>(
    formData.datasetName,
  );
  const [datasetNameValidity, setDatasetNameValidity] = useState({
    valid: false,
    message: "",
  });

  useEffect(() => {
    if (!tileServiceTypeValidity.valid || !map || !sourceURL) return;

    const source = map.getSource(PREVIEW_TMS_SOURCE_ID);
    if (source) {
      map.removeLayer(PREVIEW_TMS_LAYER_ID);
      map.removeSource(PREVIEW_TMS_SOURCE_ID);
    }

    setLoading(true);
    setError("");

    try {
      if (isOpenAerialMap || tileServiceType === TileServiceType.TILEJSON) {
        map.addSource(PREVIEW_TMS_SOURCE_ID, {
          type: "raster",
          url: sourceURL,
          tileSize: 256,
        });
      } else {
        map.addSource(PREVIEW_TMS_SOURCE_ID, {
          type: "raster",
          tiles: [sourceURL],
          tileSize: 256,
        });
      }

      map.addLayer({
        id: PREVIEW_TMS_LAYER_ID,
        type: "raster",
        source: PREVIEW_TMS_SOURCE_ID,
        layout: { visibility: "visible" },
      });
    } catch (e) {
      setError(
        "Unable to load the tile server. Please verify the URL and try again.",
      );
    } finally {
      setLoading(false);
    }

    return () => {
      if (!map || !map?.getStyle()) return;
      if (map.getLayer(PREVIEW_TMS_LAYER_ID))
        map.removeLayer(PREVIEW_TMS_LAYER_ID);
      if (map.getSource(PREVIEW_TMS_SOURCE_ID))
        map.removeSource(PREVIEW_TMS_SOURCE_ID);
    };
  }, [
    map,
    sourceURL,
    tileServiceType,
    tileServiceTypeValidity.valid,
    isOpenAerialMap,
  ]);

  useEffect(() => {
    if (!tileJSONMetadata?.bounds || !map) return;
    map.fitBounds(tileJSONMetadata.bounds);
  }, [tileJSONMetadata]);

  const handleDatasetNameValidity = (e: { valid: any; message: any }) => {
    setDatasetNameValidity({
      valid: e.valid,
      message: e.message,
    });
  };

  /**
   * Set the validity of the dataset name on component mount.
   */
  useEffect(() => {
    setDatasetNameValidity(validateDatasetName(trainingdatasetName));
  }, [trainingdatasetName]);

  const handleTrainingDatasetCreation = useCallback(() => {
    handleChange(MODEL_CREATION_FORM_NAME.TILESERVICE_TYPE, tileServiceType);
    createNewTrainingDatasetMutation.mutate({
      source_imagery: tileserverURL,
      name: trainingdatasetName,
    });
  }, [createNewTrainingDatasetMutation, tileserverURL, trainingdatasetName]);

  const trainingDatasetCreationInProgress =
    createNewTrainingDatasetMutation.isPending;

  return (
    <div className="flex flex-col md:flex-row justify-between gap-12">
      <div className="flex flex-col gap-y-10 max-w-3xl w-full md:w-1/2">
        <Input
          handleInput={(e) => setTrainingDatasetName(e.target.value)}
          value={trainingdatasetName}
          toolTipContent={
            MODELS_CONTENT.modelCreation.trainingDataset.form.datasetName
              .toolTip
          }
          label={
            MODELS_CONTENT.modelCreation.trainingDataset.form.datasetName.label
          }
          labelWithTooltip
          placeholder={
            MODELS_CONTENT.modelCreation.trainingDataset.form.datasetName
              .placeholder
          }
          isValid={datasetNameValidity.valid}
          validationStateUpdateCallback={handleDatasetNameValidity}
          showBorder
          helpText={datasetNameValidity.message}
          maxLength={
            FORM_VALIDATION_CONFIG[MODEL_CREATION_FORM_NAME.DATASET_NAME]
              .maxLength
          }
          minLength={
            FORM_VALIDATION_CONFIG[MODEL_CREATION_FORM_NAME.DATASET_NAME]
              .minLength
          }
        />
        <div>
          <XYZTileServerInput
            isValid={tileServiceTypeValidity}
            setTileServerURL={(e) => setTileserverURL(e)}
            tileServerURL={tileserverURL}
            validationStateUpdateCallback={(validationState) =>
              setTileServiceTypeValidity(validationState)
            }
            tileServiceType={tileServiceType}
            setTileServiceType={setTileServiceType}
          />
        </div>
        {tileJSONMetadata !== null && tileserverURL.length > 0 && (
          <div className="text-body-4 text-grey border border-gray-border p-2 rounded-lg max-h-60 overflow-y-auto">
            <p className="font-semibold text-dark">TileJSON Metadata</p>
            {Object.entries(tileJSONMetadata).map(([key, value]) => (
              <p key={key}>
                <strong>{key.charAt(0).toUpperCase() + key.slice(1)}:</strong>{" "}
                {Array.isArray(value) ? value.join(", ") : value?.toString()}
              </p>
            ))}
          </div>
        )}
        <Button
          variant={ButtonVariant.DARK}
          className="w-full md:w-1/2"
          onClick={handleTrainingDatasetCreation}
          disabled={
            trainingDatasetCreationInProgress ||
            !tileServiceTypeValidity.valid ||
            !datasetNameValidity.valid ||
            loading
          }
        >
          {trainingDatasetCreationInProgress ? <Spinner /> : "Create Dataset"}
        </Button>
      </div>
      <div className="w-full md:w-1/2 ">
        <div className="border border-gray-border relative h-80 rounded-lg overflow-clip">
          <MapComponent map={map} mapContainerRef={mapContainerRef} />
          {loading && (
            <div className="absolute inset-0 bg-white flex items-center justify-center z-10">
              <Spinner />
            </div>
          )}
          {!tileServiceTypeValidity.valid && !loading && (
            <div className="p-1 absolute z-[10] inset-0 bg-off-white flex flex-col gap-y-3 items-center justify-center w-full h-full text-body-4 md:text-base text-grey">
              <MapIcon className="icon-lg" />
              <p>Enter a valid tile service url to see a preview.</p>
            </div>
          )}
          {error && tileserverURL.length > 0 && (
            <div className="absolute inset-0 bg-white flex items-center justify-center z-10 text-primary text-center px-4">
              {error}
            </div>
          )}{" "}
        </div>
        {tileServiceType !== TileServiceType.TILEJSON && (
          <p className="text-body-4 text-grey mt-2">
            Selected {tileServiceType} tile service. Consider using TileJSON or
            OpenAerialMap TMS, for automatic bounds detection and metadata.
          </p>
        )}
      </div>
    </div>
  );
};

export default CreateNewTrainingDatasetForm;
