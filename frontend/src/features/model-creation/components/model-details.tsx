import {
  FORM_VALIDATION_CONFIG,
  MODEL_CREATION_FORM_NAME,
  useModelFormContext,
} from "@/app/providers/model-creation-provider";
import { Input, Select, TextArea } from "@/components/ui/form";
import { BASE_MODELS } from "@/enums";
import { StepHeading } from "@/features/model-creation/components/";
import { MODEL_CREATION_CONTENT } from "@/utils";

const baseModelOptions = [
  {
    name: BASE_MODELS.RAMP,
    value: "RAMP",
  },
  {
    name: BASE_MODELS.YOLOV8_V1,
    value: "YOLO_V8_V1",
  },
  {
    name: BASE_MODELS.YOLOV8_V2,
    value: "YOLO_V8_V2",
  },
];

const ModelDetailsForm = () => {
  const { formData, handleChange } = useModelFormContext();
  return (
    <div className="flex flex-col gap-y-6">
      <StepHeading
        heading={MODEL_CREATION_CONTENT.modelDetails.pageTitle}
        description={MODEL_CREATION_CONTENT.modelDetails.pageDescription}
      />
      <div className="flex flex-col gap-y-10">
        <Input
          handleInput={(e) =>
            handleChange(MODEL_CREATION_FORM_NAME.MODEL_NAME, e.target.value)
          }
          value={formData.modelName}
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
            FORM_VALIDATION_CONFIG[MODEL_CREATION_FORM_NAME.MODEL_NAME]
              .maxLength
          }
          minLength={
            FORM_VALIDATION_CONFIG[MODEL_CREATION_FORM_NAME.MODEL_NAME]
              .minLength
          }
        />
        <TextArea
          handleChange={(e) =>
            handleChange(
              MODEL_CREATION_FORM_NAME.MODEL_DESCRIPTION,
              e.target.value,
            )
          }
          label={
            MODEL_CREATION_CONTENT.modelDetails.form.modelDescription.label
          }
          helpText={
            MODEL_CREATION_CONTENT.modelDetails.form.modelDescription.helpText
          }
          labelWithTooltip
          toolTipContent={
            MODEL_CREATION_CONTENT.modelDetails.form.modelDescription.toolTip
          }
          placeholder={
            MODEL_CREATION_CONTENT.modelDetails.form.modelDescription
              .placeholder
          }
          value={formData.modelDescription}
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
        <Select
          label={MODEL_CREATION_CONTENT.modelDetails.form.baseModel.label}
          helpText={MODEL_CREATION_CONTENT.modelDetails.form.baseModel.helpText}
          labelWithTooltip
          toolTipContent={
            MODEL_CREATION_CONTENT.modelDetails.form.baseModel.toolTip
          }
          defaultValue={formData.baseModel}
          options={baseModelOptions}
          handleChange={(e) =>
            handleChange(MODEL_CREATION_FORM_NAME.BASE_MODELS, e.target.value)
          }
          required
        />
      </div>
    </div>
  );
};

export default ModelDetailsForm;
