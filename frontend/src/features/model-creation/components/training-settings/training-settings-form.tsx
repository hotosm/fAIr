import { CheckboxGroup, FormLabel, Input } from "@/components/ui/form";
import { useEffect, useState } from "react";
import { ChevronDownIcon } from "@/components/ui/icons";
import { ButtonWithIcon } from "@/components/ui/button";
import {
  AdvancedGuageIcon,
  BasicGuageIcon,
  IntermediateGuageIcon,
} from "@/components/ui/icons";
import { BASE_MODELS, INPUT_TYPES, TrainingType } from "@/enums";
import {
  FORM_VALIDATION_CONFIG,
  MODEL_CREATION_FORM_NAME,
  useModelsContext,
} from "@/app/providers/models-provider";
import { MODEL_CREATION_CONTENT } from "@/utils";

const trainingTypes = [
  { label: TrainingType.BASIC, Icon: BasicGuageIcon },
  { label: TrainingType.INTERMEDIATE, Icon: IntermediateGuageIcon },
  { label: TrainingType.ADVANCED, Icon: AdvancedGuageIcon },
];




const TrainingSettingsForm = () => {
  const [showAdvancedSettings, setShowAdvancedSettings] =
    useState<boolean>(false);

  const { formData, handleChange } = useModelsContext();

  const advancedSettings = [
    {
      label: MODEL_CREATION_CONTENT.trainingSettings.form.epoch.label,
      value: MODEL_CREATION_FORM_NAME.EPOCH,
      toolTip: MODEL_CREATION_CONTENT.trainingSettings.form.epoch.toolTip,
      enabled: true
    },
    {
      label: MODEL_CREATION_CONTENT.trainingSettings.form.contactSpacing.label,
      value: MODEL_CREATION_FORM_NAME.CONTACT_SPACING,
      toolTip:
        MODEL_CREATION_CONTENT.trainingSettings.form.contactSpacing.toolTip,
      enabled: formData.baseModel === BASE_MODELS.RAMP,

    },
    {
      label: MODEL_CREATION_CONTENT.trainingSettings.form.batchSize.label,
      value: MODEL_CREATION_FORM_NAME.BATCH_SIZE,
      toolTip: MODEL_CREATION_CONTENT.trainingSettings.form.batchSize.toolTip,
      enabled: true
    },
    {
      label: MODEL_CREATION_CONTENT.trainingSettings.form.boundaryWidth.label,
      value: MODEL_CREATION_FORM_NAME.BOUNDARY_WIDTH,
      toolTip: MODEL_CREATION_CONTENT.trainingSettings.form.boundaryWidth.toolTip,
      enabled: formData.baseModel === BASE_MODELS.RAMP
    },
  ];

  const defaultTrainingSettings = {
    [TrainingType.BASIC]: {
      epoch: formData.baseModel === BASE_MODELS.RAMP ? 2 : 20,
      batchSize: formData.baseModel === BASE_MODELS.RAMP ? 4 : 8,
      contactSpacing: 8,
      boundaryWidth: 3,
    },
    [TrainingType.INTERMEDIATE]: {
      epoch: formData.baseModel === BASE_MODELS.RAMP ? 20 : 50,
      batchSize: formData.baseModel === BASE_MODELS.RAMP ? 8 : 12,
      contactSpacing: 8,
      boundaryWidth: 3,
    },
    [TrainingType.ADVANCED]: {
      epoch: formData.baseModel === BASE_MODELS.RAMP ? 30 : 150,
      batchSize: formData.baseModel === BASE_MODELS.RAMP ? 12 : 16,
      contactSpacing: 8,
      boundaryWidth: 3,
    },
  };


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
          label={MODEL_CREATION_CONTENT.trainingSettings.form.zoomLevel.label}
          withTooltip
          toolTipContent={
            MODEL_CREATION_CONTENT.trainingSettings.form.zoomLevel.toolTip
          }
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
          onCheck={(selection) =>
            handleChange(
              MODEL_CREATION_FORM_NAME.ZOOM_LEVELS,
              selection.sort().map(Number),
            )
          }
        />
      </div>

      <div className="flex flex-col gap-y-6">
        <FormLabel
          label={
            MODEL_CREATION_CONTENT.trainingSettings.form.trainingType.label
          }
          withTooltip
          toolTipContent={
            MODEL_CREATION_CONTENT.trainingSettings.form.trainingType.toolTip
          }
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
            label={
              MODEL_CREATION_CONTENT.trainingSettings.form.advancedSettings
                .label
            }
            withTooltip
            toolTipContent={
              MODEL_CREATION_CONTENT.trainingSettings.form.advancedSettings
                .toolTip
            }
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
            {advancedSettings.filter(setting => setting.enabled).map((setting, id) => (
              <div key={`training-settings-${id}`} className="w-full">
                <Input
                  label={setting.label}
                  labelWithTooltip
                  type={INPUT_TYPES.NUMBER}
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
