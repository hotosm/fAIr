import {
  MODEL_CREATION_FORM_NAME,
  useModelsContext,
} from "@/app/providers/models-provider";
import { useGetTMSTileJSON } from "@/features/model-creation/hooks/use-tms-tilejson";
import { ToolTip } from "@/components/ui/tooltip";
import { FullScreenIcon } from "@/components/ui/icons";
import { useCallback, useEffect } from "react";
import { useMap } from "@/app/providers/map-provider";
import { MODEL_CREATION_CONTENT, truncateString } from "@/utils";

const OpenAerialMap = ({ tileJSONURL }: { tileJSONURL: string }) => {
  const { handleChange } = useModelsContext();
  const { map } = useMap();
  const { isPending, data, isError } = useGetTMSTileJSON(tileJSONURL);

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
    <div className="flex w-full flex-col  gap-y-2 border-b-8 border-off-white px-4 pb-4">
      <p className="text-body-2 md:text-body-1 font-medium">
        {MODEL_CREATION_CONTENT.trainingArea.form.openAerialMap}
      </p>
      <div className="flex flex-col w-full items-center justify-between gap-y-4">
        {isError ? (
          <p>{MODEL_CREATION_CONTENT.trainingArea.openAerialMapErrorMessage}</p>
        ) : isPending ? (
          <div className="w-full h-20 bg-gray-border animate-pulse"></div>
        ) : (
          <>
            <div className="flex gap-x-3 justify-between w-full">
              <p
                className="basis-4/5 text-start text-body-3 text-wrap"
                title={data?.name}
              >
                {truncateString(data?.name, 80)}
              </p>
              <ToolTip
                content={
                  MODEL_CREATION_CONTENT.trainingArea.toolTips.fitToTMSBounds
                }
              >
                <button
                  className="bg-off-white p-2 rounded-md h-fit w-fit"
                  disabled={!map || isPending || isError}
                  onClick={fitToTMSBounds}
                >
                  <FullScreenIcon className="icon-lg" />
                </button>
              </ToolTip>
            </div>
            <div className="flex items-center justify-between w-full gap-x-4">
              <p className="text-body-4">
                {MODEL_CREATION_CONTENT.trainingArea.form.maxZoom}{" "}
                {data?.maxzoom ?? 0}
              </p>
              <p className="text-body-4">
                {MODEL_CREATION_CONTENT.trainingArea.form.minZoom}{" "}
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
