import {
  FORM_VALIDATION_CONFIG,
  MODEL_CREATION_FORM_NAME,
} from "@/app/providers/models-provider";
import { Input } from "@/components/ui/form";
import { MODEL_CREATION_CONTENT } from "@/utils";

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
        MODEL_CREATION_CONTENT.modelDetails.form.modelName.toolTip
      }
      label={MODEL_CREATION_CONTENT.modelDetails.form.modelName.label}
      labelWithTooltip
      placeholder={
        MODEL_CREATION_CONTENT.modelDetails.form.modelName.placeholder
      }
      showBorder
      helpText={MODEL_CREATION_CONTENT.modelDetails.form.modelName.helpText}
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
