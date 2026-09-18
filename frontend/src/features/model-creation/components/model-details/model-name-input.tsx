import { Input } from "@/components/ui/form";
import { MODELS_CONTENT } from "@/constants";
import {
  FORM_VALIDATION_CONFIG,
  MODEL_CREATION_FORM_NAME,
} from "@/app/providers/models-provider";
import { useState } from "react";

const ModelNameFormInput = ({
  handleChange,
  value,
}: {
  value: string;
  handleChange: (value: string) => void;
}) => {
  const [modelNameIsValid, setModelNameIsValid] = useState({
    valid:
      value.length >=
        FORM_VALIDATION_CONFIG[MODEL_CREATION_FORM_NAME.MODEL_NAME].minLength &&
      value.length <=
        FORM_VALIDATION_CONFIG[MODEL_CREATION_FORM_NAME.MODEL_NAME].maxLength,
    message: "",
  });
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
      validationStateUpdateCallback={setModelNameIsValid}
      isValid={value.length > 0 && modelNameIsValid.valid}
      showBorder
      helpText={modelNameIsValid.message}
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
