import React from "react";
import { API_ENDPOINTS, apiClient } from "@/services";
import { Button } from "@/components/ui/button";
import { DialogProps } from "@/types";
import { Drawer } from "@/components/ui/drawer";
import { DrawerPlacements, SHOELACE_SIZES } from "@/enums";
import { errorMessages, MODELS_CONTENT } from "@/constants";
import { showErrorToast } from "@/utils";
import { Spinner } from "@/components/ui/spinner";
import { TrainingAreaMap } from "@/features/models/components";
import { useQuery } from "@tanstack/react-query";

type TAPIResponse = {
  result: string;
};

const getTrainingAreaPMTilesUrl = async (
  trainingAreaId: number,
): Promise<TAPIResponse> => {
  const { data } = await apiClient.get(
    API_ENDPOINTS.GET_PMTILES_URL(trainingAreaId),
  );
  if (!data || !data.result) {
    showErrorToast(undefined, errorMessages.MAP_LOAD_FAILURE);
    throw new Error(errorMessages.MAP_LOAD_FAILURE);
  }
  return data;
};

type TrainingAreaDrawerProps = DialogProps & {
  trainingAreaId: number;
  tmsURL: string;
};

export const TrainingAreaDrawer: React.FC<TrainingAreaDrawerProps> = ({
  isOpened,
  closeDialog,
  trainingAreaId,
  tmsURL,
}) => {
  const { data, isLoading, isError, refetch } = useQuery<TAPIResponse, Error>({
    queryKey: ["training-area-pmtiles-url", trainingAreaId],
    queryFn: () => getTrainingAreaPMTilesUrl(trainingAreaId),
    enabled: isOpened,
  });

  return (
    <Drawer
      open={isOpened}
      setOpen={closeDialog}
      placement={DrawerPlacements.BOTTOM}
      label={MODELS_CONTENT.trainingArea.modalTitle}
      noHeader={false}
    >
      <div className="w-full flex items-center justify-center h-full">
        {isLoading && (
          <div className="flex flex-col items-center justify-center">
            <Spinner />
            <span className="text-gray">
              {MODELS_CONTENT.trainingArea.map.loadingText}
            </span>
          </div>
        )}

        {isError && (
          <div className="text-center space-y-4">
            <p className="text-red-500">{errorMessages.MAP_LOAD_FAILURE}</p>
            <Button onClick={() => refetch()} size={SHOELACE_SIZES.MEDIUM}>
              {MODELS_CONTENT.trainingArea.retryButton}
            </Button>
          </div>
        )}

        {data?.result && tmsURL && (
          <div className="w-full h-full relative">
            <TrainingAreaMap
              file={data.result}
              trainingAreaId={trainingAreaId}
              tmsURL={tmsURL}
              visible={isOpened}
            />
          </div>
        )}
      </div>
    </Drawer>
  );
};
