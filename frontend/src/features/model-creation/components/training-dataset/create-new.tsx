import { useEffect, useState } from "react";
import {
  MODEL_CREATION_FORM_NAME,
  useModelsContext,
} from "@/app/providers/models-provider";
import { MapIcon } from "@/components/ui/icons";
import { useMapInstance } from "@/hooks/use-map-instance";
import { MapComponent } from "@/components/map";
import { Spinner } from "@/components/ui/spinner";

import { TileServiceType } from "@/enums";
import { useTileservice } from "@/hooks/use-tileservice";
import { NewTrainingDatasetForm } from "./training-dataset-form";
import { getTileServerTypeFromURL } from "@/utils";

const PREVIEW_TMS_SOURCE_ID = "preview-tms-source";
const PREVIEW_TMS_LAYER_ID = "preview-tms-layer";

const CreateNewTrainingDatasetForm = () => {
  const { formData, handleChange } = useModelsContext();
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
    } catch {
      setError(
        "Unable to load the tile server. Please verify the URL and try again."
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

  return (
    <div className="flex flex-col justify-between gap-12 md:flex-row">
      <div className="flex w-full max-w-3xl flex-col gap-y-10 md:w-1/2">
        <NewTrainingDatasetForm
          datasetName={formData.datasetName}
          tileServiceType={tileServiceType}
          onClick={() =>
            handleChange(
              MODEL_CREATION_FORM_NAME.TILESERVICE_TYPE,
              tileServiceType
            )
          }
          setTileServiceType={setTileServiceType}
          isCreateNewDataset
          setTileServiceTypeValidity={setTileServiceTypeValidity}
          tileServiceTypeValidity={tileServiceTypeValidity}
          setTileserverURL={setTileserverURL}
          tileserverURL={tileserverURL}
          loading={loading}
          tileJSONMetadata={tileJSONMetadata}
          onSuccess={(data) => {
            handleChange(MODEL_CREATION_FORM_NAME.DATASET_NAME, data.name);
            handleChange(MODEL_CREATION_FORM_NAME.TMS_URL, data.source_imagery);
            handleChange(
              MODEL_CREATION_FORM_NAME.TILESERVICE_TYPE,
              getTileServerTypeFromURL(data.source_imagery)
            );
            handleChange(
              MODEL_CREATION_FORM_NAME.SELECTED_TRAINING_DATASET_ID,
              data.id
            );
            handleChange(MODEL_CREATION_FORM_NAME.DATASET_OFFSET, data.offset);
          }}
        />
      </div>
      <div className="w-full md:w-1/2 ">
        <div className="relative h-80 text-clip rounded-lg border border-gray-border">
          <MapComponent map={map} mapContainerRef={mapContainerRef} />
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white">
              <Spinner />
            </div>
          )}
          {!tileServiceTypeValidity.valid && !loading && (
            <div className="absolute inset-0 z-10 flex size-full flex-col items-center justify-center gap-y-3 bg-off-white p-1 text-body-4 text-grey md:text-base">
              <MapIcon className="icon-lg" />
              <p>Enter a valid tile service url to see a preview.</p>
            </div>
          )}
          {error && tileserverURL.length > 0 && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white px-4 text-center text-primary">
              {error}
            </div>
          )}{" "}
        </div>
        {tileServiceType !== TileServiceType.TILEJSON && (
          <p className="mt-2 text-body-4 text-grey">
            Selected {tileServiceType} tile service. Consider using TileJSON or
            OpenAerialMap TMS, for automatic bounds detection and metadata.
          </p>
        )}
      </div>
    </div>
  );
};

export default CreateNewTrainingDatasetForm;
