import { Dialog } from "@/components/ui/dialog";

import { FormLabel, Input } from "@/components/ui/form";
import { RadioGroup } from "@/components/ui/form/radio-group/radio-group";
import { useState } from "react";
import { ModelSettings } from "@/features/start-mapping/components/model-settings";
import { Feature, TModelDetails, TQueryParams } from "@/types";
import { Button } from "@/components/ui/button";
import { ButtonVariant } from "@/enums";
import { Alert } from "@/components/ui/alert";
import {
  calculateGeoJSONArea,
  formatAreaInAppropriateUnit,
  showErrorToast,
} from "@/utils";
import { useSubmitOfflinePredictionsRequest } from "@/features/start-mapping/hooks/use-model-predictions";
import { SEARCH_PARAMS } from "@/app/routes/start-mapping";
import { useParams } from "react-router-dom";
import { Geometry } from "geojson";

import { useDialog } from "@/hooks/use-dialog";
import { DatabaseIcon, LayerStackIcon, MapIcon } from "@/components/ui/icons";
import { PredictionImagerySource } from "@/enums/start-mapping";
import { OfflinePredictionRequestSuccess } from "./offline-prediction-request-success-dialog";

const MINIMUM_PREDICTION_NAME_LENGTH = 2;
const MAXIMUM_PREDICTION_NAME_LENGTH = 50;
export const OfflinePredictionRequestDialog = ({
  isOpen,
  onClose,
  query,
  updateQuery,
  drawnAOI,
  predictionModelCheckpoint,
  tileServerURL,
  modelInfo,
  resetOfflinePredictionModeState,
  predictionImagerySource,
  predictionModel,
}: {
  isOpen: boolean;
  onClose: () => void;
  query: TQueryParams;
  updateQuery: (newParams: TQueryParams) => void;
  drawnAOI: Feature | null;
  modelInfo: TModelDetails;
  tileServerURL: string | undefined;
  predictionModelCheckpoint: string;
  resetOfflinePredictionModeState: () => void;
  predictionImagerySource: PredictionImagerySource;
  predictionModel: string;
}) => {
  const { modelId } = useParams();
  const [predictionRequestName, setPredictionRequestName] =
    useState<string>("");
  const [zoomLevel, setZoomLevel] = useState<string>("18");
  const { isOpened, openDialog, closeDialog } = useDialog();
  const modelPredictionMutation = useSubmitOfflinePredictionsRequest({
    mutationConfig: {
      onSuccess: () => {
        // show success dialog
        openDialog();
        // reset state
        resetOfflinePredictionModeState();
        setPredictionRequestName("");
        setZoomLevel("18");
        onClose();
      },
      onError: (error) => showErrorToast(error),
    },
  });

  return (
    <>
      <OfflinePredictionRequestSuccess
        isOpen={isOpened}
        onClose={closeDialog}
      />
      <Dialog
        isOpened={isOpen}
        closeDialog={onClose}
        label="Request Offline Prediction"
        preventClose={modelPredictionMutation.isPending}
      >
        <Alert>
          <small className="text-xs md:text-body-3">
            Set the parameters for your prediction request. Selected model and
            imagery will be used to generate predictions for the selected zoom
            level. You can also set advanced settings for your prediction
            request.
          </small>
        </Alert>
        <div className="border border-gray-border rounded-md mt-2">
          <div className="p-4">
            <h3 className="text-body-3 md:text-body-2 font-semibold  mb-3 flex items-center gap-2">
              Request Summary
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-body-4 md:text-body-3">
              <div className="flex items-center gap-2">
                <DatabaseIcon className="icon md:icon-lg" />
                <div>
                  <div className="font-medium ">Model</div>
                  <div className="">{predictionModel}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <MapIcon className="icon md:icon-lg" />
                <div>
                  <div className="font-medium ">AOI Size</div>
                  <div className="">
                    {formatAreaInAppropriateUnit(
                      drawnAOI ? calculateGeoJSONArea(drawnAOI as Feature) : 0,
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <LayerStackIcon className="icon md:icon-lg" />
                <div>
                  <div className="font-medium">Imagery</div>
                  <div className="">{predictionImagerySource}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-8 mt-4">
          <Input
            handleInput={(e) => setPredictionRequestName(e.target.value)}
            value={predictionRequestName}
            toolTipContent={
              "Set a name for your prediction request. This will help you identify it later."
            }
            label={"Prediction Request Name"}
            labelWithTooltip
            placeholder={"Enter a name for your prediction request"}
            showBorder
            maxLength={MAXIMUM_PREDICTION_NAME_LENGTH}
            minLength={MINIMUM_PREDICTION_NAME_LENGTH}
          />

          <div>
            <FormLabel
              label={"Zoom Levels"}
              withTooltip
              toolTipContent={
                "Select the zoom levels for which you want to generate predictions. You can select multiple zoom levels."
              }
            />
            <RadioGroup
              options={[
                { label: "Zoom 18", value: "18" },
                { label: "Zoom 19", value: "19" },
                { label: "Zoom 20", value: "20" },
                { label: "Zoom 21", value: "21" },
              ]}
              className="md:items-center gap-x-8 flex-col md:flex-row"
              value={zoomLevel}
              onChange={(selection) => setZoomLevel(selection)}
            />
          </div>
          <div>
            <FormLabel
              label={"Advanced Settings"}
              withTooltip
              toolTipContent={
                "You can select the advanced settings for your prediction request. These settings will be applied to your predictions."
              }
            />
            <div className="border rounded-xl">
              <ModelSettings query={query} updateQuery={updateQuery} isMobile />
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between gap-8">
            <Button
              variant={ButtonVariant.DARK}
              onClick={onClose}
              className="md:!w-fit"
              disabled={modelPredictionMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              className="md:!w-fit"
              variant={ButtonVariant.PRIMARY}
              disabled={
                predictionRequestName.trim().length <
                  MINIMUM_PREDICTION_NAME_LENGTH ||
                modelPredictionMutation.isPending
              }
              onClick={() => {
                modelPredictionMutation.mutateAsync({
                  description: predictionRequestName,
                  geom: drawnAOI?.geometry as Geometry,
                  config: {
                    tolerance: query[SEARCH_PARAMS.tolerance] as number,
                    area_threshold: query[SEARCH_PARAMS.area] as number,
                    orthogonalize: query[
                      SEARCH_PARAMS.orthogonalize
                    ] as boolean,
                    confidence: query[SEARCH_PARAMS.confidenceLevel] as number,
                    checkpoint: predictionModelCheckpoint,
                    ortho_max_angle_change_deg: query[
                      SEARCH_PARAMS.maxAngleChange
                    ] as number,
                    zoom_level: parseInt(zoomLevel, 10),
                    model_id: modelId as string,
                    ortho_skew_tolerance_deg: query[
                      SEARCH_PARAMS.skewTolerance
                    ] as number,
                    source:
                      tileServerURL ??
                      (modelInfo?.dataset?.source_imagery as string),
                  },
                });
              }}
            >
              Submit Request
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
};
