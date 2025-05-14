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

  return (
    <div className="flex flex-col md:flex-row justify-between gap-12">
      <div className="flex flex-col gap-y-10 max-w-3xl w-full md:w-1/2">
        <NewTrainingDatasetForm
          datasetName={formData.datasetName}
          tileServiceType={tileServiceType}
          onClick={() =>
            handleChange(
              MODEL_CREATION_FORM_NAME.TILESERVICE_TYPE,
              tileServiceType,
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
              MODEL_CREATION_FORM_NAME.SELECTED_TRAINING_DATASET_ID,
              data.id,
            );
            handleChange(MODEL_CREATION_FORM_NAME.DATASET_OFFSET, data.offset);
          }}
        />
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
