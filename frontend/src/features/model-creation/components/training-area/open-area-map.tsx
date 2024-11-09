import {
  MODEL_CREATION_FORM_NAME,
  useModelFormContext,
} from "@/app/providers/model-creation-provider";
import { useGetTMSTileJSON } from "@/features/model-creation/hooks/use-tms-tilejson";
import { ToolTip } from "@/components/ui/tooltip";
import { FullScreenIcon } from "@/components/ui/icons";
import { useCallback, useEffect } from "react";
import { useMap } from "@/app/providers/map-provider";
import { truncateString } from "@/utils";

const OpenAerialMap = ({ tileJSONURL }: { tileJSONURL: string }) => {
  const { handleChange } = useModelFormContext();
  const { map } = useMap();
  const { isPending, data, isError } = useGetTMSTileJSON(tileJSONURL);

  const fitToTMSBounds = useCallback(() => {
    if (!map || !data?.bounds) return;
    map?.fitBounds(data?.bounds);
  }, [map, data?.bounds]);

  useEffect(() => {
    if (!data) return;
    handleChange(MODEL_CREATION_FORM_NAME.OAM_BOUNDS, data.bounds);
    handleChange(MODEL_CREATION_FORM_NAME.OAM_TIME_NAME, data.name);
  }, [data]);

  useEffect(() => {
    if (!map || !data?.bounds) return;
    fitToTMSBounds();
  }, [map, fitToTMSBounds]);

  return (
    <div className="flex  flex-col  gap-y-2 w-full border-b-8 border-off-white px-4 pb-4">
      <p className="text-body-1">Open Aerial Map</p>
      <div className="flex flex-col w-full items-center justify-between gap-y-4">
        {isError ? (
          <p>
            Invalid TMS provided. Please go back to select another training
            dataset.
          </p>
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
              <ToolTip content="Zoom to Image">
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
              <p className="text-body-4">Max zoom: {data?.maxzoom ?? 0}</p>
              <p className="text-body-4">Min zoom: {data?.minzoom ?? 0}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default OpenAerialMap;
