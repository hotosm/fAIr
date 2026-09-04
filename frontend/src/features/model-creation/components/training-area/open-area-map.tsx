import { FullScreenIcon } from "@/components/ui/icons";
import { Map } from "maplibre-gl";
import { MODELS_CONTENT } from "@/constants";
import { showErrorToast } from "@/utils";
import { ToolTip } from "@/components/ui/tooltip";
import { useEffect } from "react";
import { useGetTrainingDataset } from "@/features/datasets/hooks/use-datasets";
import { TileJSON } from "@/types";

const OpenAerialMap = ({
  map,
  trainingDatasetId,
  hasBounds,
  fitToBounds,
  loading,
  tileJSONMetadata,
  error,
}: {
  map: Map | null;
  trainingDatasetId: number;
  hasBounds: boolean;
  fitToBounds: () => void;
  loading: boolean;
  tileJSONMetadata: TileJSON | null;
  error: string;
}) => {
  const { data: trainingDataset, isError: trainingDatasetFetchError } =
    useGetTrainingDataset(trainingDatasetId);

  useEffect(() => {
    if (trainingDatasetFetchError) {
      showErrorToast(undefined, "Failed to fetch training dataset");
    }
  }, [trainingDatasetFetchError]);

  return (
    <div className="flex w-full  flex-col gap-y-2 bg-white py-2 px-4 rounded-lg">
      <p className="text-body-2 md:text-body-1 font-medium">
        {MODELS_CONTENT.modelCreation.trainingArea.form.openAerialMap}
      </p>
      <div className="flex flex-col w-full items-center justify-between gap-y-4">
        {error ? (
          <p>{MODELS_CONTENT.modelCreation.trainingArea.openAerialMapErrorMessage}</p>
        ) : loading ? (
          <div className="w-full h-16 bg-gray-border animate-pulse"></div>
        ) : (
          <>
            <div className="flex gap-x-3 justify-between w-full">
              <p
                className="basis-4/5 text-start text-body-3 overflow-hidden text-ellipsis text-wrap w-full"
                title={trainingDataset?.name}
              >
                {trainingDataset?.name}
              </p>
              <ToolTip
                content={
                  hasBounds
                    ? MODELS_CONTENT.modelCreation.trainingArea.toolTips.fitToTMSBounds
                    : "This dataset does not have bounds. Zoom in to see the area of interest."
                }
              >
                <button
                  className="bg-off-white p-2 rounded-md h-fit w-fit "
                  disabled={!map || !hasBounds}
                  onClick={fitToBounds}
                >
                  <FullScreenIcon className="icon-lg" />
                </button>
              </ToolTip>
            </div>
            {hasBounds && (
              <div className="flex items-center justify-between w-full gap-x-4">
                <p className="text-body-4">
                  {MODELS_CONTENT.modelCreation.trainingArea.form.maxZoom}{" "}
                  {tileJSONMetadata?.maxzoom ?? 0}
                </p>
                <p className="text-body-4">
                  {MODELS_CONTENT.modelCreation.trainingArea.form.minZoom}{" "}
                  {tileJSONMetadata?.minzoom ?? 0}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default OpenAerialMap;
