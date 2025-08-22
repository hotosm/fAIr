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
      showErrorToast("Failed to fetch training dataset");
    }
  }, [trainingDatasetFetchError]);

  return (
    <div className="flex w-full  flex-col gap-y-2 rounded-lg bg-white px-4 py-2">
      <p className="text-body-2 font-medium md:text-body-1">
        {MODELS_CONTENT.modelCreation.trainingArea.form.openAerialMap}
      </p>
      <div className="flex w-full flex-col items-center justify-between gap-y-4">
        {error ? (
          <p>
            {
              MODELS_CONTENT.modelCreation.trainingArea
                .openAerialMapErrorMessage
            }
          </p>
        ) : loading ? (
          <div className="h-16 w-full animate-pulse bg-gray-border"></div>
        ) : (
          <>
            <div className="flex w-full justify-between gap-x-3">
              <p
                className="w-full basis-4/5 overflow-hidden text-ellipsis text-wrap text-start text-body-3"
                title={trainingDataset?.name}
              >
                {trainingDataset?.name}
              </p>
              <ToolTip
                content={
                  hasBounds
                    ? MODELS_CONTENT.modelCreation.trainingArea.toolTips
                        .fitToTMSBounds
                    : "This dataset does not have bounds. Zoom in to see the area of interest."
                }
              >
                <button
                  className="size-fit rounded-md bg-off-white p-2 "
                  disabled={!map || !hasBounds}
                  onClick={fitToBounds}
                >
                  <FullScreenIcon className="icon-lg" />
                </button>
              </ToolTip>
            </div>
            {hasBounds && (
              <div className="flex w-full items-center justify-between gap-x-4">
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
