import { Input } from "@/components/ui/form";
import { MODELS_CONTENT } from "@/constants";
import {
  FORM_VALIDATION_CONFIG,
  MODEL_CREATION_FORM_NAME,
} from "@/app/providers/models-provider";

const ModelNameFormInput = ({
  handleChange,
  value,
}: {
  value: string;
  handleChange: (value: string) => void;
}) => {
  return (
    <Input
      handleInput={(e) => handleChange(e.target.value)}
      value={value}
      toolTipContent={
        MODELS_CONTENT.modelCreation.modelDetails.form.modelName.toolTip
      }
      label={MODELS_CONTENT.modelCreation.modelDetails.form.modelName.label}
      labelWithTooltip
      placeholder={
        MODELS_CONTENT.modelCreation.modelDetails.form.modelName.placeholder
      }
      showBorder
      helpText={
        MODELS_CONTENT.modelCreation.modelDetails.form.modelName.helpText
      }
      required
      maxLength={
        FORM_VALIDATION_CONFIG[MODEL_CREATION_FORM_NAME.MODEL_NAME].maxLength
      }
      minLength={
        FORM_VALIDATION_CONFIG[MODEL_CREATION_FORM_NAME.MODEL_NAME].minLength
      }
    />
  );
};

export default ModelNameFormInput;
