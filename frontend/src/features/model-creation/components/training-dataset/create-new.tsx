import {
  FORM_VALIDATION_CONFIG,
  MODEL_CREATION_FORM_NAME,
  useModelFormContext,
} from "@/app/providers/model-creation-provider";
import { Input } from "@/components/ui/form";
import { useMemo } from "react";

const CreateNewTrainingDatasetForm = () => {
  const { formData, handleChange } = useModelFormContext();

  const tmsURLHelpText = useMemo(() => {
    const helpText =
      "TMS imagery link should look like this https://tiles.openaerialmap.org/****/*/***/{z}/{x}/{y}";
    return formData.tmsURLValidation.message.length > 0
      ? formData.tmsURLValidation.message
      : helpText;
  }, [formData.tmsURLValidation.message]);

  return (
    <div className="flex flex-col gap-y-10">
      <p className="font-semibold text-body-1 mb-2">
        Create New Training Dataset
      </p>
      <Input
        handleInput={(e) =>
          handleChange(MODEL_CREATION_FORM_NAME.DATASET_NAME, e.target.value)
        }
        value={formData.datasetName}
        toolTipContent="Hello"
        label="Dataset Name"
        labelWithTooltip
        placeholder="Enter the dataset name"
        showBorder
        helpText="Dataset name should be at least 10 characters and at most 40 characters."
        required
        maxLength={
          FORM_VALIDATION_CONFIG[MODEL_CREATION_FORM_NAME.DATASET_NAME]
            .maxLength
        }
        minLength={
          FORM_VALIDATION_CONFIG[MODEL_CREATION_FORM_NAME.DATASET_NAME]
            .minLength
        }
      />
      {/* Check mark icon for validated inputs */}
      <Input
        value={formData.tmsURL}
        labelWithTooltip
        toolTipContent="Hello"
        label="TMS URL"
        placeholder="https://tiles.openaerialmap.org/****/*/***/{z}/{x}/{y}"
        showBorder
        helpText={tmsURLHelpText}
        required
        pattern={
          FORM_VALIDATION_CONFIG[MODEL_CREATION_FORM_NAME.TMS_URL].pattern
        }
        handleInput={(e) =>
          handleChange(MODEL_CREATION_FORM_NAME.TMS_URL, e.target.value)
        }
        type="url"
        validationStateUpdateCallback={(validationState) =>
          handleChange(
            MODEL_CREATION_FORM_NAME.TMS_URL_VALIDITY,
            validationState,
          )
        }
        isValid={formData.tmsURLValidation.valid}
      />
    </div>
  );
};

export default CreateNewTrainingDatasetForm;
