import { Input, Select, TextArea } from "@/components/ui/form";

import StepHeading from "../step-heading";

const BASE_MODELS = [
  {
    name: "YOLO",
    value: "yolo",
  },
  {
    name: "RAMP",
    value: "ramp",
  },
];
const ModelDetailsForm = () => {
  return (
    <div className="flex flex-col gap-y-10">
      <StepHeading
        heading="Create New Local AI Model"
        description=" Lorem ipsum dolor sit amet, consectetur adipisicing elit. Id fugit
        ducimus harum debitis deserunt cum quod quam rerum aliquid. Quibusdam
        sequi incidunt quasi delectus laudantium accusamus modi omnis maiores.
        Incidunt!"
      />
      <div className="flex flex-col gap-y-20">
        <Input
          handleInput={() => null}
          value=""
          toolTipContent="Hello"
          label="Label"
          labelWithTooltip
          placeholder="Enter the model name"
          showBorder
          helpText="Name Instructions"
        />
        <TextArea
          label="Model Description"
          helpText="Description Instructions"
          labelWithTooltip
          toolTipContent="This form"
          placeholder="Placeholder"
        />
        <Select
          label="Base Model"
          helpText="This is a model"
          labelWithTooltip
          toolTipContent="Pick a base model"
          placeholder="model1"
          options={BASE_MODELS}
        />
      </div>
    </div>
  );
};

export default ModelDetailsForm;
