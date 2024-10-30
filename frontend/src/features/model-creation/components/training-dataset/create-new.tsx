import { Input } from "@/components/ui/form";
import { ToolTip } from "@/components/ui/tooltip";

const CreateNewTrainingDatasetForm = () => {
  return (
    <div className="flex flex-col gap-y-10">
      <p className="font-semibold text-body-1 mb-2">
        Create New Training Dataset
      </p>
      <Input
        handleInput={() => null}
        value=""
        toolTipContent="Hello"
        label="Dataset Name"
        labelWithTooltip
        placeholder="San Jose Buildings"
        showBorder
        helpText="This is the dataset name..."
        required
      />
      <div className="flex flex-col gap-y-4">
        <p className="text-gray">
          Texts <ToolTip content={"This form"} />
        </p>
        <div className="w-full h-60 flex items-center justify-center bg-off-white rounded-md">
          <p>rest</p>
        </div>
      </div>
      {/* Check mark icon for validated inputs */}
      <Input
        handleInput={() => null}
        value=""
        label="Or paste link here"
        placeholder="https://tiles.openaerialmap.org/****/*/***/{z}/{x}/{y}"
        showBorder
        helpText="TMS imagery link should look like this https://tiles.openaerialmap.org/****/*/***/{z}/{x}/{y}"
        required
      />
    </div>
  );
};

export default CreateNewTrainingDatasetForm;
