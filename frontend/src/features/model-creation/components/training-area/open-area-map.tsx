import { FullScreenIcon } from '@/components/ui/icons';
import { Map } from 'maplibre-gl';
import { MODELS_CONTENT } from '@/constants';
import { showErrorToast } from '@/utils';
import { ToolTip } from '@/components/ui/tooltip';
import { useCallback, useEffect } from 'react';
import { useGetTMSTileJSON } from '@/features/model-creation/hooks/use-tms-tilejson';
import { useGetTrainingDataset } from '@/features/models/hooks/use-dataset';
import {
  MODEL_CREATION_FORM_NAME,
  useModelsContext,
} from "@/app/providers/models-provider";

const OpenAerialMap = ({
  tileJSONURL,
  map,
  trainingDatasetId,
}: {
  tileJSONURL: string;
  map: Map | null;
  trainingDatasetId: number;
}) => {
  const { handleChange } = useModelsContext();

  const { isPending, data, isError } = useGetTMSTileJSON(tileJSONURL);

  const { data: trainingDataset, isError: trainingDatasetFetchError } =
    useGetTrainingDataset(trainingDatasetId);

  useEffect(() => {
    if (trainingDatasetFetchError) {
      showErrorToast(undefined, 'Failed to fetch training dataset');
    }
  }, [trainingDatasetFetchError]);

  const fitToTMSBounds = useCallback(() => {
    if (!map || !data?.bounds) return;
    map?.fitBounds(data?.bounds);
  }, [map, data?.bounds]);

  useEffect(() => {
    if (!data) return;
    handleChange(MODEL_CREATION_FORM_NAME.OAM_BOUNDS, data.bounds);
    handleChange(MODEL_CREATION_FORM_NAME.OAM_TILE_NAME, data.name);
  }, [data]);

  useEffect(() => {
    if (!map || !data?.bounds) return;
    fitToTMSBounds();
  }, [map, fitToTMSBounds]);

  return (
    <div className="flex w-full flex-col  gap-y-2 border-b-8 border-off-white py-2 px-4 pb-4">
      <p className="text-body-2 md:text-body-1 font-medium">
        {MODELS_CONTENT.modelCreation.trainingArea.form.openAerialMap}
      </p>
      <div className="flex flex-col w-full items-center justify-between gap-y-4">
        {isError ? (
          <p>
            {
              MODELS_CONTENT.modelCreation.trainingArea
                .openAerialMapErrorMessage
            }
          </p>
        ) : isPending ? (
          <div className="w-full h-20 bg-gray-border animate-pulse"></div>
        ) : (
          <>
            <div className="flex gap-x-3 justify-between w-full">
              <p
                className="basis-4/5 text-start text-body-3 overflow-hidden text-ellipsis text-wrap w-full"
                title={data?.name}
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
                  disabled={!map || isPending || isError}
                  onClick={fitToTMSBounds}
                >
                  <FullScreenIcon className="icon-lg" />
                </button>
              </ToolTip>
            </div>
            <div className="flex items-center justify-between w-full gap-x-4">
              <p className="text-body-4">
                {MODELS_CONTENT.modelCreation.trainingArea.form.maxZoom}{" "}
                {data?.maxzoom ?? 0}
              </p>
              <p className="text-body-4">
                {MODELS_CONTENT.modelCreation.trainingArea.form.minZoom}{" "}
                {data?.minzoom ?? 0}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default OpenAerialMap;
