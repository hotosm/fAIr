import { PredictionModel } from "@/enums/start-mapping";
import { useMemo, useState } from "react";
import { RadioGroup } from "@/components/ui/form/radio-group/radio-group";
import { FormLabel, HelpText, Input } from "@/components/ui/form";
import { MODELS_CONTENT } from "@/constants";
import { Button } from "@/components/ui/button";
import { INPUT_TYPES, SHOELACE_SIZES } from "@/enums";
import {
  constructModelCheckpointPath,
  showSuccessToast,
  VALID_MODEL_CHECKPOINT_PATH,
} from "@/utils";
import { TModelDetails } from "@/types";
import { FAIR_BASE_MODELS_PATH } from "@/config";
import { Divider } from "@/components/ui/divider";

export const ModelSelector = ({
  predictionModel,
  setPredictionModel,
  predictionModelCheckpoint,
  setPredictionModelCheckpoint,
  isMobile,
  defaultPredictionModel,
  setCustomPredictionModelCheckpointPath,
  customPredictionModelCheckpointPath,
  modelInfo,
}: {
  predictionModel: string;
  setPredictionModel: (value: string) => void;
  predictionModelCheckpoint: string;
  setPredictionModelCheckpoint: React.Dispatch<React.SetStateAction<string>>;
  isMobile?: boolean;
  defaultPredictionModel?: string;
  customModelCheckpointPath?: string;
  customPredictionModelCheckpointPath: string;
  setCustomPredictionModelCheckpointPath: React.Dispatch<
    React.SetStateAction<string>
  >;
  modelInfo: TModelDetails;
}) => {
  const PredictionModels = useMemo(
    () => [
      {
        value: PredictionModel.DEFAULT,
        label: defaultPredictionModel || "Default",
        tooltip: "Default model for generating predictions.",
      },
      {
        value: PredictionModel.RAMP,
        label: "RAMP",
        tooltip:
          MODELS_CONTENT.modelCreation.modelDetails.form.baseModel.suffixes[
            PredictionModel.RAMP
          ],
      },
      {
        value: PredictionModel.YOLOV8_V1,
        label: "YOLO v8 v1",
        tooltip:
          MODELS_CONTENT.modelCreation.modelDetails.form.baseModel.suffixes[
            PredictionModel.YOLOV8_V1
          ],
      },
      {
        value: PredictionModel.YOLOV8_V2,
        label: "YOLO v8 v2",
        tooltip:
          MODELS_CONTENT.modelCreation.modelDetails.form.baseModel.suffixes[
            PredictionModel.YOLOV8_V2
          ],
      },
      {
        value: PredictionModel.CUSTOM,
        label: "Custom",
        tooltip: "Custom model for generating predictions.",
      },
    ],
    [defaultPredictionModel, predictionModel],
  );

  const PredictionModelsCheckpoints = useMemo(
    () => ({
      [PredictionModel.DEFAULT]: constructModelCheckpointPath(
        modelInfo ?? {
          dataset: { id: "" },
          published_training: "",
          base_model: "",
        },
      ),
      [PredictionModel.RAMP]: FAIR_BASE_MODELS_PATH[PredictionModel.RAMP],
      [PredictionModel.YOLOV8_V1]:
        FAIR_BASE_MODELS_PATH[PredictionModel.YOLOV8_V1],
      [PredictionModel.YOLOV8_V2]:
        FAIR_BASE_MODELS_PATH[PredictionModel.YOLOV8_V2],
      [PredictionModel.CUSTOM]: predictionModelCheckpoint,
    }),
    [predictionModelCheckpoint, modelInfo, predictionModel],
  );

  return (
    <div
      className={` bg-white ${isMobile ? "w-full" : "w-[350px]  shadow-lg rounded-xl border border-gray-border "} p-4 max-h-[400px] gap-y-4 overflow-y-auto flex flex-col scrollable`}
    >
      {!isMobile && (
        <div>
          <FormLabel
            withTooltip
            label="Model"
            toolTipContent="Choose a base model for generating predictions."
          />
          <Divider />
        </div>
      )}
      <RadioGroup
        options={PredictionModels}
        onChange={(e: string) => {
          setPredictionModel(e);
          if (e !== PredictionModel.CUSTOM) {
            setPredictionModelCheckpoint(
              PredictionModelsCheckpoints[e as keyof typeof PredictionModel],
            );
          } else {
            /**
             * Reset the model checkpoint to an empty string if the custom option is selected.
             * That way, it won't preserve the previous option checkpoint.
             */
            setPredictionModelCheckpoint("");
          }
        }}
        value={predictionModel}
        withTooltip
      />
      {predictionModel === PredictionModel.CUSTOM && (
        <CustomModelInput
          setPredictionModelCheckpoint={setPredictionModelCheckpoint}
          customModelCheckpointPath={customPredictionModelCheckpointPath}
          setCustomModelCheckpointPath={setCustomPredictionModelCheckpointPath}
        />
      )}
    </div>
  );
};

const CustomModelInput = ({
  customModelCheckpointPath,
  setCustomModelCheckpointPath,
  setPredictionModelCheckpoint,
}: {
  customModelCheckpointPath: string;
  setCustomModelCheckpointPath: React.Dispatch<React.SetStateAction<string>>;
  setPredictionModelCheckpoint: React.Dispatch<React.SetStateAction<string>>;
}) => {
  const [isValid, setIsValid] = useState({
    valid: false,
    message: "",
  });

  return (
    <div className="flex flex-col gap-y-2 mt-2">
      <Input
        label={"Custom Model Checkpoint"}
        labelWithTooltip
        value={customModelCheckpointPath}
        toolTipContent={
          "Provide the path to your custom model checkpoint file. Ensure the file is accessible and valid."
        }
        placeholder={"e.g. https://your-server/checkpoint.onnx"}
        showBorder
        pattern={VALID_MODEL_CHECKPOINT_PATH.source}
        handleInput={(e) => setCustomModelCheckpointPath(e.target.value)}
        type={INPUT_TYPES.URL}
        validationStateUpdateCallback={setIsValid}
        isValid={customModelCheckpointPath.length > 0 && isValid.valid}
        size={SHOELACE_SIZES.SMALL}
      />
      <HelpText>
        {isValid.message.length > 0 ? (
          isValid.message
        ) : (
          <span className="text-wrap text-xs">
            The custom model checkpoint path should point to a valid model file.
            For example, you can use a URL like:{" "}
            {`https://your-server/checkpoint.tflite`}.
          </span>
        )}
      </HelpText>
      <Button
        className="!w-fit"
        size={SHOELACE_SIZES.SMALL}
        disabled={customModelCheckpointPath.length === 0 || !isValid.valid}
        onClick={() => {
          setPredictionModelCheckpoint(customModelCheckpointPath);
          showSuccessToast("Custom model checkpoint applied successfully.");
        }}
      >
        Apply
      </Button>
    </div>
  );
};
