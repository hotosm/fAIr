import {
  FORM_VALIDATION_CONFIG,
  MODEL_CREATION_FORM_NAME,
  useModelFormContext,
} from "@/app/providers/model-creation-provider";
import { Input } from "@/components/ui/form";
import { INPUT_TYPES } from "@/enums";
import { MODEL_CREATION_CONTENT } from "@/utils";
import { useEffect, useMemo } from "react";

const CreateNewTrainingDatasetForm = () => {
  const { formData, handleChange } = useModelFormContext();

  const tmsURLHelpText = useMemo(() => {
    const helpText = MODEL_CREATION_CONTENT.trainingDataset.form.tmsURL.helpText;
    return formData.tmsURLValidation.message.length > 0
      ? formData.tmsURLValidation.message
      : helpText;
  }, [formData.tmsURLValidation.message]);

  useEffect(() => {
    // Shoelace will handle the validation when it's more than 0 characters.
    if (formData.tmsURL.length > 0) return;
    // if the length is 0, then validation is false
    if (formData.tmsURL.length === 0) {
      handleChange(MODEL_CREATION_FORM_NAME.TMS_URL_VALIDITY, {
        valid: false,
        message: "",
      });
    }
  }, [formData.tmsURL]);
  return (
    <div className="flex flex-col gap-y-10">
      <p className="font-semibold text-body-1 mb-2">
        {MODEL_CREATION_CONTENT.trainingDataset.form.newTrainingDatasetSectionHeading}
      </p>
      <Input
        handleInput={(e) =>
          handleChange(MODEL_CREATION_FORM_NAME.DATASET_NAME, e.target.value)
        }
        value={formData.datasetName}
        toolTipContent={MODEL_CREATION_CONTENT.trainingDataset.form.datasetName.toolTip}
        label={MODEL_CREATION_CONTENT.trainingDataset.form.datasetName.label}
        labelWithTooltip
        placeholder={MODEL_CREATION_CONTENT.trainingDataset.form.datasetName.placeholder}
        showBorder
        helpText={MODEL_CREATION_CONTENT.trainingDataset.form.datasetName.helpText}
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
        toolTipContent={MODEL_CREATION_CONTENT.trainingDataset.form.tmsURL.toolTip}
        label={MODEL_CREATION_CONTENT.trainingDataset.form.tmsURL.label}
        placeholder={MODEL_CREATION_CONTENT.trainingDataset.form.tmsURL.placeholder}
        showBorder
        helpText={tmsURLHelpText}
        required
        pattern={
          FORM_VALIDATION_CONFIG[MODEL_CREATION_FORM_NAME.TMS_URL].pattern
        }
        handleInput={(e) =>
          handleChange(MODEL_CREATION_FORM_NAME.TMS_URL, e.target.value)
        }
        type={INPUT_TYPES.URL}
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
