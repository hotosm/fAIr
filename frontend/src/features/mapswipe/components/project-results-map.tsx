import { DialogProps } from "@/types";
import { TrainingAreaMap } from "@/features/models/components";
import { useQuery } from "@tanstack/react-query";
import { errorMessages, MODELS_CONTENT } from "@/constants";
import { Spinner } from "@/components/ui/spinner";
import { Button, ButtonWithIcon } from "@/components/ui/button";
import { ButtonVariant, DrawerPlacements, SHOELACE_SIZES } from "@/enums";
import { API_ENDPOINTS, apiClient } from "@/services";
import { showErrorToast } from "@/utils";
import { Drawer } from "@/components/ui/drawer";
import { CloudDownloadIcon } from "@/components/ui/icons";
import { BASE_API_URL } from "@/config";
import { DropDown } from "@/components/ui/dropdown";

type PredictionResultProps = DialogProps & {
  predictionId: number;
  tileServiceUrl: string;
  folder?: string;
};

type TAPIResponse = {
  result: string;
};

const getPredicitionResultPMTilesUrl = async (
  predictionId: number,
  folder?: string,
): Promise<TAPIResponse> => {
  const { data } = await apiClient.get(
    API_ENDPOINTS.GET_PREDICTIONS_PMTILES_URL(predictionId, folder),
  );
  if (!data || !data.result) {
    showErrorToast(undefined, errorMessages.MAP_LOAD_FAILURE);
    throw new Error(errorMessages.MAP_LOAD_FAILURE);
  }
  return data;
};

export const MapSwipeProjectResultMapDrawer: React.FC<
  PredictionResultProps
> = ({ isOpened, closeDialog, predictionId, tileServiceUrl, folder }) => {
  const { data, isLoading, isError, refetch } = useQuery<TAPIResponse, Error>({
    queryKey: ["prediction-result-pmtiles-url", predictionId],
    queryFn: () => getPredicitionResultPMTilesUrl(predictionId, folder),
    enabled: isOpened,
  });

  return (
    <Drawer
      open={isOpened}
      setOpen={closeDialog}
      placement={DrawerPlacements.BOTTOM}
      label={"Prediction Result"}
      noHeader={false}
    >
      <div className="w-full flex items-center justify-center h-full">
        {isLoading && (
          <div className="flex flex-col items-center justify-center">
            <Spinner />
            <span className="text-grey">
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
        {data?.result && tileServiceUrl && (
          <div className="flex w-full h-full flex-col space-y-4">
            <div className="flex justify-end">
              <DropDown
                triggerComponent={
                  <ButtonWithIcon
                    label="Download Results"
                    disabled={!data?.result}
                    className="!w-fit"
                    size={SHOELACE_SIZES.MEDIUM}
                    variant={ButtonVariant.PRIMARY}
                    prefixIcon={CloudDownloadIcon}
                    textClassName="capitalize"
                  />
                }
                menuItems={[
                  {
                    name: "As Points",
                    value: "As Points",
                    onClick: () => {
                      const downloadUrl =
                        BASE_API_URL +
                        API_ENDPOINTS.DOWNLOAD_PREDICTION_RESULTS_POINTS_LABELS_FILE_(
                          predictionId,
                          folder,
                        );
                      window.open(downloadUrl, "_blank");
                    },
                  },
                  {
                    name: "As Polygons",
                    value: "As Polygons",
                    onClick: () => {
                      const downloadUrl =
                        BASE_API_URL +
                        API_ENDPOINTS.DOWNLOAD_PREDICTION_LABELS_FILE(
                          predictionId,
                          folder,
                        );
                      window.open(downloadUrl, "_blank");
                    },
                  },
                ]}
              />
            </div>
            <div className="w-full h-full relative border">
              <TrainingAreaMap
                tmsURL={tileServiceUrl}
                trainingAreaId={predictionId}
                visible={isOpened}
                file={data.result}
                isPredictionResult
              />
            </div>
          </div>
        )}
      </div>
    </Drawer>
  );
};
