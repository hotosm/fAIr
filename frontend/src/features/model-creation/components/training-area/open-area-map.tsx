import { FullScreenIcon } from "@/components/ui/icons";
import { Map } from "maplibre-gl";
import { MODELS_CONTENT } from "@/constants";
import { showErrorToast } from "@/utils";
import { ToolTip } from "@/components/ui/tooltip";
import { useCallback, useEffect } from "react";
import {
  MODEL_CREATION_FORM_NAME,
  useModelsContext,
} from "@/app/providers/models-provider";
import { useGetTrainingDataset } from "@/features/datasets/hooks/use-datasets";
import { TileJSON } from "@/types";

const OpenAerialMap = ({
  map,
  trainingDatasetId,
  OAMIsPending,
  OAMIsError,
  OAMData,
}: {
  map: Map | null;
  trainingDatasetId: number;
  OAMIsPending: boolean;
  OAMIsError: boolean;
  OAMData: TileJSON;
}) => {
  const { handleChange } = useModelsContext();

  const { data: trainingDataset, isError: trainingDatasetFetchError } =
    useGetTrainingDataset(trainingDatasetId);

  useEffect(() => {
    if (trainingDatasetFetchError) {
      showErrorToast(undefined, "Failed to fetch training dataset");
    }
  }, [trainingDatasetFetchError]);

  const fitToTMSBounds = useCallback(() => {
    if (!map || !OAMData?.bounds) return;
    map?.fitBounds(OAMData?.bounds);
  }, [map, OAMData?.bounds]);

  useEffect(() => {
    if (!OAMData) return;
    handleChange(MODEL_CREATION_FORM_NAME.OAM_BOUNDS, OAMData.bounds);
    handleChange(MODEL_CREATION_FORM_NAME.OAM_TILE_NAME, OAMData.name);
  }, [OAMData]);

  useEffect(() => {
    if (!map || !OAMData?.bounds) return;
    fitToTMSBounds();
  }, [map, fitToTMSBounds]);

  return (
    <div className="flex w-full  flex-col gap-y-2 bg-white py-2 px-4 rounded-lg">
      <p className="text-body-2 md:text-body-1 font-medium">
        {MODELS_CONTENT.modelCreation.trainingArea.form.openAerialMap}
      </p>
      <div className="flex flex-col w-full items-center justify-between gap-y-4">
        {OAMIsError ? (
          <p>
            {
              MODELS_CONTENT.modelCreation.trainingArea
                .openAerialMapErrorMessage
            }
          </p>
        ) : OAMIsPending ? (
          <div className="w-full h-16 bg-gray-border animate-pulse"></div>
        ) : (
          <>
            <div className="flex gap-x-3 justify-between w-full">
              <p
                className="basis-4/5 text-start text-body-3 overflow-hidden text-ellipsis text-wrap w-full"
                title={OAMData?.name}
              >
                {trainingDataset?.name}
              </p>
              <ToolTip
                content={
                  MODELS_CONTENT.modelCreation.trainingArea.toolTips
                    .fitToTMSBounds
                }
              >
                <button
                  className="bg-off-white p-2 rounded-md h-fit w-fit "
                  disabled={!map || OAMIsPending || OAMIsError}
                  onClick={fitToTMSBounds}
                >
                  <FullScreenIcon className="icon-lg" />
                </button>
              </ToolTip>
            </div>
            <div className="flex items-center justify-between w-full gap-x-4">
              <p className="text-body-4">
                {MODELS_CONTENT.modelCreation.trainingArea.form.maxZoom}{" "}
                {OAMData?.maxzoom ?? 0}
              </p>
              <p className="text-body-4">
                {MODELS_CONTENT.modelCreation.trainingArea.form.minZoom}{" "}
                {OAMData?.minzoom ?? 0}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default OpenAerialMap;
