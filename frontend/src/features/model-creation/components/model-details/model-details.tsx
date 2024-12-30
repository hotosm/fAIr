import ModelDescriptionFormInput from "./model-description-input";
import ModelNameFormInput from "@/features/model-creation/components/model-details/model-name-input";
import { BASE_MODELS } from "@/enums";
import { MODELS_CONTENT } from "@/constants";
import { Select } from "@/components/ui/form";
import { StepHeading } from "@/features/model-creation/components/";
import {
  MODEL_CREATION_FORM_NAME,
  useModelsContext,
} from "@/app/providers/models-provider";

const baseModelOptions = [
  {
    name: BASE_MODELS.RAMP,
    value: BASE_MODELS.RAMP,
    suffix:
      MODELS_CONTENT.modelCreation.modelDetails.form.baseModel.suffixes[
        BASE_MODELS.RAMP
      ],
  },
  {
    name: BASE_MODELS.YOLOV8_V1,
    value: BASE_MODELS.YOLOV8_V1,
    suffix:
      MODELS_CONTENT.modelCreation.modelDetails.form.baseModel.suffixes[
        BASE_MODELS.YOLOV8_V1
      ],
  },
  {
    name: BASE_MODELS.YOLOV8_V2,
    value: BASE_MODELS.YOLOV8_V2,
    suffix:
      MODELS_CONTENT.modelCreation.modelDetails.form.baseModel.suffixes[
        BASE_MODELS.YOLOV8_V2
      ],
  },
];

const ModelDetailsForm = () => {
  const { formData, handleChange } = useModelsContext();
  return (
    <div className="flex flex-col gap-y-6">
      <StepHeading
        heading={MODELS_CONTENT.modelCreation.modelDetails.pageTitle}
        description={MODELS_CONTENT.modelCreation.modelDetails.pageDescription}
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
          label={MODELS_CONTENT.modelCreation.modelDetails.form.baseModel.label}
          helpText={
            MODELS_CONTENT.modelCreation.modelDetails.form.baseModel.helpText
          }
          labelWithTooltip
          toolTipContent={
            MODELS_CONTENT.modelCreation.modelDetails.form.baseModel.toolTip
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
