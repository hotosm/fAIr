import {
  FORM_VALIDATION_CONFIG,
  MODEL_CREATION_FORM_NAME,
  useModelFormContext,
} from "@/app/providers/model-creation-provider";
import { Input, Select, TextArea } from "@/components/ui/form";
import { BASE_MODEL } from "@/enums";
import { StepHeading } from "@/features/model-creation/components/";

const BASE_MODELS = [
  {
    name: BASE_MODEL.RAMP,
    value: "ramp",
  },
  {
    name: BASE_MODEL.YOLOV8,
    value: "yolov8",
  },
];

const ModelDetailsForm = () => {
  const { formData, handleChange } = useModelFormContext();

  return (
    <div className="flex flex-col gap-y-6">
      <StepHeading
        heading="Create New Local AI Model"
        description=" Lorem ipsum dolor sit amet, consectetur adipisicing elit. Id fugit
        ducimus harum debitis deserunt cum quod quam rerum aliquid. Quibusdam
        sequi incidunt quasi delectus laudantium accusamus modi omnis maiores.
        Incidunt!"
      />
      <div className="flex flex-col gap-y-10">
        <Input
          handleInput={(e) =>
            handleChange(MODEL_CREATION_FORM_NAME.MODEL_NAME, e.target.value)
          }
          value={formData.modelName}
          toolTipContent="Hello"
          label="Model Name"
          labelWithTooltip
          placeholder="Enter the model name"
          showBorder
          helpText="Model name should be at least 10 characters and at most 40 characters."
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
          label="Model Description"
          helpText="Model description should be at least 10 characters and at most 500 characters."
          labelWithTooltip
          toolTipContent="This form"
          placeholder="Enter the model description..."
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
          label="Base Model"
          helpText="Select the base model to use for the training."
          labelWithTooltip
          toolTipContent="Basemodels are ..."
          defaultValue={formData.baseModel}
          options={BASE_MODELS}
          handleChange={(e) =>
            handleChange(MODEL_CREATION_FORM_NAME.BASE_MODEL, e.target.value)
          }
          required
        />
      </div>
    </div>
  );
};

export default ModelDetailsForm;
