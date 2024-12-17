import React from "react";
import { Dialog } from "@/components/ui/dialog";
import useScreenSize from "@/hooks/use-screen-size";
import { MapComponent } from "@/components/map";
import { cn, showErrorToast } from "@/utils";
import { DialogProps } from "@/types";
import { API_ENDPOINTS, apiClient } from "@/services";
import { useQuery } from "@tanstack/react-query";
import { errorMessages, modelPagesContent, } from "@/constants";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { SHOELACE_SIZES } from "@/enums";
import { ControlsPosition } from "@/enums";


type TAPIResponse = {
  result: string;
};

const getTrainingAreaPmtilesUrl = async (trainingAreaId: number): Promise<TAPIResponse> => {
  const { data } = await apiClient.get(API_ENDPOINTS.GET_PMTILES_URL(trainingAreaId));
  if (!data || !data.result) {
    showErrorToast(undefined, errorMessages.MAP_LOAD_FAILURE)
    throw new Error(errorMessages.MAP_LOAD_FAILURE);
  }
  return data;
};

type TrainingAreaDialogProps = DialogProps & { trainingAreaId: number };

const TrainingAreaDialog: React.FC<TrainingAreaDialogProps> = ({
  isOpened,
  closeDialog,
  trainingAreaId
}) => {
  const { isMobile } = useScreenSize();

  const {
    data,
    isLoading,
    isError,
    refetch
  } = useQuery<TAPIResponse, Error>({
    queryKey: ["training-area-pmtiles-url", trainingAreaId],
    queryFn: () => getTrainingAreaPmtilesUrl(trainingAreaId),
  });

  // load the pmtiles and zoom to the layer i.e fit bounds
  console.log(data?.result);

  return (
    <Dialog
      isOpened={isOpened}
      closeDialog={closeDialog}
      label={modelPagesContent.trainingArea.modalTitle}
    >
      <div className={cn(`${!isMobile ? "h-[600px]" : "h-[350px]"}`)}>
        <div className="h-full w-full flex items-center justify-center">

          {isLoading && (
            <div className="flex flex-col items-center justify-center">
              <Spinner />
              <span className="text-gray">{modelPagesContent.trainingArea.map.loadingText}</span>
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
            <MapComponent layerControl controlsPosition={ControlsPosition.TOP_LEFT} />
          ) : null}
        </div>
      </div>
    </Dialog>
  );
};

export default TrainingAreaDialog;
