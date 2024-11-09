import {
  FORM_VALIDATION_CONFIG,
  MODEL_CREATION_FORM_NAME,
} from "@/app/providers/model-creation-provider";
import { TextArea } from "@/components/ui/form";
import { MODEL_CREATION_CONTENT } from "@/utils";

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
      label={MODEL_CREATION_CONTENT.modelDetails.form.modelDescription.label}
      helpText={
        MODEL_CREATION_CONTENT.modelDetails.form.modelDescription.helpText
      }
      labelWithTooltip
      toolTipContent={
        MODEL_CREATION_CONTENT.modelDetails.form.modelDescription.toolTip
      }
      placeholder={
        MODEL_CREATION_CONTENT.modelDetails.form.modelDescription.placeholder
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
