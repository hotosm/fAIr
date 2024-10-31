import { CheckboxGroup, FormLabel, Input } from "@/components/ui/form";
import { useEffect, useState } from "react";
import ChevronDownIcon from "@/components/ui/icons/chevron-down";
import { ButtonWithIcon } from "@/components/ui/button";
import {
  AdvancedGuageIcon,
  BasicGuageIcon,
  IntermediateGuageIcon,
} from "@/components/ui/icons";
import { TrainingType } from "@/enums";
import {
  FORM_VALIDATION_CONFIG,
  MODEL_CREATION_FORM_NAME,
  useModelFormContext,
} from "@/app/providers/model-creation-provider";

const trainingTypes = [
  { label: TrainingType.BASIC, Icon: BasicGuageIcon },
  { label: TrainingType.INTERMEDIATE, Icon: IntermediateGuageIcon },
  { label: TrainingType.ADVANCED, Icon: AdvancedGuageIcon },
];

const defaultTrainingSettings = {
  [TrainingType.BASIC]: {
    epoch: 2,
    batchSize: 4,
    contactSpacing: 8,
    boundaryWidth: 3,
  },
  [TrainingType.INTERMEDIATE]: {
    epoch: 20,
    batchSize: 8,
    contactSpacing: 8,
    boundaryWidth: 3,
  },
  [TrainingType.ADVANCED]: {
    epoch: 30,
    batchSize: 12,
    contactSpacing: 8,
    boundaryWidth: 3,
  },
};

const advancedSettings = [
  {
    label: "Epoch",
    value: MODEL_CREATION_FORM_NAME.EPOCH,
    toolTip: "Epochs for training",
  },
  {
    label: "Contact Spacing",
    value: MODEL_CREATION_FORM_NAME.CONTACT_SPACING,
    toolTip: "Number of items per batch",
  },
  {
    label: "Batch Size",
    value: MODEL_CREATION_FORM_NAME.BATCH_SIZE,
    toolTip: "Spacing between contacts",
  },
  {
    label: "Boundary Width",
    value: MODEL_CREATION_FORM_NAME.BOUNDARY_WIDTH,
    toolTip: "Width of the boundaries",
  },
];

const TrainingSettingsForm = () => {
  const [showAdvancedSettings, setShowAdvancedSettings] =
    useState<boolean>(false);

  const { formData, handleChange } = useModelFormContext();

  useEffect(() => {
    handleChange(
      MODEL_CREATION_FORM_NAME.EPOCH,
      defaultTrainingSettings[formData.trainingType].epoch,
    );
    handleChange(
      MODEL_CREATION_FORM_NAME.BATCH_SIZE,
      defaultTrainingSettings[formData.trainingType].batchSize,
    );
    handleChange(
      MODEL_CREATION_FORM_NAME.CONTACT_SPACING,
      defaultTrainingSettings[formData.trainingType].contactSpacing,
    );
    handleChange(
      MODEL_CREATION_FORM_NAME.BOUNDARY_WIDTH,
      defaultTrainingSettings[formData.trainingType].boundaryWidth,
    );
  }, [formData.trainingType]);

  return (
    <div className="flex flex-col gap-y-10 w-full">
      <div className="flex flex-col gap-y-6">
        <FormLabel
          label="Select Zoom Level"
          withTooltip
          toolTipContent="Zoom levels are"
          required
        />
        <CheckboxGroup
          variant="primary"
          multiple
          className="flex-row gap-x-10 items-center"
          options={[
            { value: "Zoom 19", apiValue: "19" },
            { value: "Zoom 20", apiValue: "20" },
            { value: "Zoom 21", apiValue: "21" },
          ]}
          defaultSelectedOption={formData.zoomLevels}
          onCheck={() =>null }
        />
      </div>

      <div className="flex flex-col gap-y-6">
        <FormLabel
          label="Select Model Training Type"
          withTooltip
          toolTipContent="content"
          required
        />
        <div className="flex items-center gap-x-4 w-full justify-between">
          {trainingTypes.map((type, id) => (
            <ButtonWithIcon
              key={`training-type-${id}`}
              onClick={() =>
                handleChange(MODEL_CREATION_FORM_NAME.TRAINING_TYPE, type.label)
              }
              label={type.label}
              variant={
                formData.trainingType === type.label ? "dark" : "default"
              }
              capitalizeText={false}
              prefixIcon={type.Icon}
              iconClassName="md:icon-lg"
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-y-6">
        <div className="flex items-center gap-x-4 w-full">
          <FormLabel
            label="Advanced settings"
            withTooltip
            toolTipContent="content"
          />
          <button
            onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
            className="self-start"
          >
            <ChevronDownIcon
              className={`icon text-dark ${showAdvancedSettings && "rotate-180"}`}
            />
          </button>
        </div>
        {showAdvancedSettings && (
          <div className="flex items-center justify-between gap-x-4">
            {advancedSettings.map((setting, id) => (
              <div key={`training-settings-${id}`} className="w-full">
                <Input
                  label={setting.label}
                  labelWithTooltip
                  type="number"
                  className="text-nowrap"
                  showBorder
                  // @ts-expect-error bad type definition
                  value={formData[setting.value]}
                  min={
                    // @ts-expect-error bad type definition
                    FORM_VALIDATION_CONFIG[setting.value].min
                  }
                  max={
                    // @ts-expect-error bad type definition
                    FORM_VALIDATION_CONFIG[setting.value].max
                  }
                  handleInput={(e) =>
                    handleChange(setting.value, Number(e.target.value))
                  }
                  toolTipContent={setting.toolTip}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TrainingSettingsForm;
