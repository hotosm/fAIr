import React from "react";
import { showErrorToast } from "@/utils";
import { DialogProps } from "@/types";
import { API_ENDPOINTS, apiClient } from "@/services";
import { useQuery } from "@tanstack/react-query";
import { errorMessages, modelPagesContent } from "@/constants";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { DrawerPlacements, SHOELACE_SIZES } from "@/enums";
import { Drawer } from "@/components/ui/drawer";
import { TrainingAreaMap } from "@/features/models/components";

type TAPIResponse = {
  result: string;
};

const getTrainingAreaPmtilesUrl = async (
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

type TrainingAreaDrawerProps = DialogProps & { trainingAreaId: number };

export const TrainingAreaDrawer: React.FC<TrainingAreaDrawerProps> = ({
  isOpened,
  closeDialog,
  trainingAreaId,
}) => {

  const { data, isLoading, isError, refetch } = useQuery<TAPIResponse, Error>({
    queryKey: ["training-area-pmtiles-url", trainingAreaId],
    queryFn: () => getTrainingAreaPmtilesUrl(trainingAreaId),
    enabled: isOpened
  });

  return (
    <Drawer
      placement={DrawerPlacements.BOTTOM}
      open={isOpened}
      setOpen={closeDialog}
      label={modelPagesContent.trainingArea.modalTitle}
      noHeader={false}
    >
      <div className="h-full w-full flex items-center justify-center">
        {isLoading && (
          <div className="flex flex-col items-center justify-center">
            <Spinner />
            <span className="text-gray">
              {modelPagesContent.trainingArea.map.loadingText}
            </span>
          </div>
        )}

        {isError && (
          <div className="text-center space-y-4">
            <p className="text-red-500">{errorMessages.MAP_LOAD_FAILURE}</p>
            <Button onClick={() => refetch()} size={SHOELACE_SIZES.MEDIUM}>
              {modelPagesContent.trainingArea.retryButton}
            </Button>
          </div>
        )}
        {!isLoading && !isError && data?.result ? (
          <TrainingAreaMap file={data.result} trainingAreaId={trainingAreaId} />
        ) : null}
      </div>
    </Drawer>
  );
};
