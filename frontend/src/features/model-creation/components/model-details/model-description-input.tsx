import { MODELS_CONTENT } from "@/constants";
import { TextArea } from "@/components/ui/form";
import {
  FORM_VALIDATION_CONFIG,
  MODEL_CREATION_FORM_NAME,
} from "@/app/providers/models-provider";

const ModelDescriptionFormInput = ({
  handleChange,
  value,
}: {
  value: string;
  handleChange: (value: string) => void;
}) => {
  return (
    <TextArea
      handleChange={(e) => handleChange(e.target.value)}
      label={
        MODELS_CONTENT.modelCreation.modelDetails.form.modelDescription.label
      }
      helpText={
        MODELS_CONTENT.modelCreation.modelDetails.form.modelDescription.helpText
      }
      labelWithTooltip
      toolTipContent={
        MODELS_CONTENT.modelCreation.modelDetails.form.modelDescription.toolTip
      }
      placeholder={
        MODELS_CONTENT.modelCreation.modelDetails.form.modelDescription
          .placeholder
      }
      value={value}
      required
      maxLength={
        FORM_VALIDATION_CONFIG[MODEL_CREATION_FORM_NAME.MODEL_DESCRIPTION]
          .maxLength
      }
      minLength={
        FORM_VALIDATION_CONFIG[MODEL_CREATION_FORM_NAME.MODEL_DESCRIPTION]
          .minLength
      }
    />
  );
};

export default ModelDescriptionFormInput;
