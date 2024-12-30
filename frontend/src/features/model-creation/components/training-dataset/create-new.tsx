import { Input } from "@/components/ui/form";
import { INPUT_TYPES } from "@/enums";
import { MODELS_CONTENT } from "@/constants";
import { useEffect } from "react";
import {
  FORM_VALIDATION_CONFIG,
  MODEL_CREATION_FORM_NAME,
  useModelsContext,
} from "@/app/providers/models-provider";

const CreateNewTrainingDatasetForm = () => {
  const { formData, handleChange } = useModelsContext();

  const tmsURLHelpText =
    formData.tmsURLValidation.message.length > 0
      ? formData.tmsURLValidation.message
      : MODELS_CONTENT.modelCreation.trainingDataset.form.tmsURL.helpText;

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
      <p className="font-semibold text-body-2 md:text-body-1 mb-2">
        {
          MODELS_CONTENT.modelCreation.trainingDataset.form
            .newTrainingDatasetSectionHeading
        }
      </p>
      <Input
        handleInput={(e) =>
          handleChange(MODEL_CREATION_FORM_NAME.DATASET_NAME, e.target.value)
        }
        value={formData.datasetName}
        toolTipContent={
          MODELS_CONTENT.modelCreation.trainingDataset.form.datasetName.toolTip
        }
        label={
          MODELS_CONTENT.modelCreation.trainingDataset.form.datasetName.label
        }
        labelWithTooltip
        placeholder={
          MODELS_CONTENT.modelCreation.trainingDataset.form.datasetName
            .placeholder
        }
        showBorder
        helpText={
          MODELS_CONTENT.modelCreation.trainingDataset.form.datasetName.helpText
        }
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
        toolTipContent={
          MODELS_CONTENT.modelCreation.trainingDataset.form.tmsURL.toolTip
        }
        label={MODELS_CONTENT.modelCreation.trainingDataset.form.tmsURL.label}
        placeholder={
          MODELS_CONTENT.modelCreation.trainingDataset.form.tmsURL.placeholder
        }
        showBorder
        helpText={tmsURLHelpText}
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
