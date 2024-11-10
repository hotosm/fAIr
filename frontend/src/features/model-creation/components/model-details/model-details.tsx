import {
  MODEL_CREATION_FORM_NAME,
  useModelsContext,
} from "@/app/providers/models-provider";
import { Select } from "@/components/ui/form";
import { BASE_MODELS } from "@/enums";
import { StepHeading } from "@/features/model-creation/components/";
import { MODEL_CREATION_CONTENT } from "@/utils";
import ModelNameFormInput from "@/features/model-creation/components/model-details/model-name-input";
import ModelDescriptionFormInput from "./model-description-input";

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
  const { formData, handleChange } = useModelsContext();
  return (
    <div className="flex flex-col gap-y-6">
      <StepHeading
        heading={MODEL_CREATION_CONTENT.modelDetails.pageTitle}
        description={MODEL_CREATION_CONTENT.modelDetails.pageDescription}
      />
      <div className="flex flex-col gap-y-10">
        <ModelNameFormInput
          value={formData.modelName}
          handleChange={(value) =>
            handleChange(MODEL_CREATION_FORM_NAME.MODEL_NAME, value)
          }
        />
        <ModelDescriptionFormInput
          value={formData.modelDescription}
          handleChange={(value) =>
            handleChange(MODEL_CREATION_FORM_NAME.MODEL_DESCRIPTION, value)
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
