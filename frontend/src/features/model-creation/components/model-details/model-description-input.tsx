import { MODELS_CONTENT } from "@/constants";
import { TextArea } from "@/components/ui/form";
import {
  FORM_VALIDATION_CONFIG,
  MODEL_CREATION_FORM_NAME,
} from "@/app/providers/models-provider";
import { useState } from "react";

const ModelDescriptionFormInput = ({
  handleChange,
  value,
}: {
  value: string;
  handleChange: (value: string) => void;
}) => {
  const [modelDescriptionIsValid, setmodelDescriptionIsValid] = useState({
    valid:
      value.length >=
        FORM_VALIDATION_CONFIG[MODEL_CREATION_FORM_NAME.MODEL_DESCRIPTION]
          .minLength &&
      value.length <=
        FORM_VALIDATION_CONFIG[MODEL_CREATION_FORM_NAME.MODEL_DESCRIPTION]
          .maxLength,
    message: "",
  });

  return (
    <TextArea
      handleChange={(e) => handleChange(e.target.value)}
      label={
        MODELS_CONTENT.modelCreation.modelDetails.form.modelDescription.label
      }
      helpText={modelDescriptionIsValid.message}
      validationStateUpdateCallback={setmodelDescriptionIsValid}
      isValid={value.length > 0 && modelDescriptionIsValid.valid}
      labelWithTooltip
      toolTipContent={
        MODELS_CONTENT.modelCreation.modelDetails.form.modelDescription.toolTip
      }
      placeholder={
        MODELS_CONTENT.modelCreation.modelDetails.form.modelDescription
          .placeholder
      }
      value={value}
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
