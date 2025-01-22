import { BASE_MODELS, INPUT_TYPES, TrainingType } from "@/enums";
import { ButtonWithIcon } from "@/components/ui/button";
import { CheckboxGroup, FormLabel, Input } from "@/components/ui/form";
import { ChevronDownIcon } from "@/components/ui/icons";
import { MODELS_CONTENT } from "@/constants";
import { useEffect, useState } from "react";
import {
  AdvancedGuageIcon,
  BasicGuageIcon,
  IntermediateGuageIcon,
} from "@/components/ui/icons";
import {
  FORM_VALIDATION_CONFIG,
  MODEL_CREATION_FORM_NAME,
  useModelsContext,
} from "@/app/providers/models-provider";

const trainingTypes = [
  { label: TrainingType.BASIC, Icon: BasicGuageIcon },
  { label: TrainingType.INTERMEDIATE, Icon: IntermediateGuageIcon },
  { label: TrainingType.ADVANCED, Icon: AdvancedGuageIcon },
];

const TrainingSettingsForm = () => {
  const [showAdvancedSettings, setShowAdvancedSettings] =
    useState<boolean>(false);
  const [validationMessage, setValidationMessage] = useState("");
  const { formData, handleChange } = useModelsContext();

  const advancedSettings = [
    {
      label: MODELS_CONTENT.modelCreation.trainingSettings.form.epoch.label,
      value: MODEL_CREATION_FORM_NAME.EPOCH,
      toolTip: MODELS_CONTENT.modelCreation.trainingSettings.form.epoch.toolTip,
      enabled: true,
    },
    {
      label: MODELS_CONTENT.modelCreation.trainingSettings.form.batchSize.label,
      value: MODEL_CREATION_FORM_NAME.BATCH_SIZE,
      toolTip:
        MODELS_CONTENT.modelCreation.trainingSettings.form.batchSize.toolTip,
      enabled: true,
    },
    {
      label:
        MODELS_CONTENT.modelCreation.trainingSettings.form.contactSpacing.label,
      value: MODEL_CREATION_FORM_NAME.CONTACT_SPACING,
      toolTip:
        MODELS_CONTENT.modelCreation.trainingSettings.form.contactSpacing
          .toolTip,
      enabled: formData.baseModel === BASE_MODELS.RAMP,
    },
    {
      label:
        MODELS_CONTENT.modelCreation.trainingSettings.form.boundaryWidth.label,
      value: MODEL_CREATION_FORM_NAME.BOUNDARY_WIDTH,
      toolTip:
        MODELS_CONTENT.modelCreation.trainingSettings.form.boundaryWidth
          .toolTip,
      enabled: formData.baseModel === BASE_MODELS.RAMP,
    },
  ];

  const defaultTrainingSettings = {
    [TrainingType.BASIC]: {
      epoch: formData.baseModel === BASE_MODELS.RAMP ? 2 : 20,
      batchSize: formData.baseModel === BASE_MODELS.RAMP ? 4 : 4,
      contactSpacing: 8,
      boundaryWidth: 3,
    },
    [TrainingType.INTERMEDIATE]: {
      epoch: formData.baseModel === BASE_MODELS.RAMP ? 20 : 50,
      batchSize: formData.baseModel === BASE_MODELS.RAMP ? 8 : 8,
      contactSpacing: 8,
      boundaryWidth: 3,
    },
    [TrainingType.ADVANCED]: {
      epoch: formData.baseModel === BASE_MODELS.RAMP ? 30 : 150,
      batchSize: formData.baseModel === BASE_MODELS.RAMP ? 8 : 8,
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
    <div className="flex flex-col gap-y-20 w-full">
      <div className="flex flex-col gap-y-6">
        <FormLabel
          label={
            MODELS_CONTENT.modelCreation.trainingSettings.form.zoomLevel.label
          }
          withTooltip
          toolTipContent={
            MODELS_CONTENT.modelCreation.trainingSettings.form.zoomLevel.toolTip
          }
          required
        />
        <CheckboxGroup
          variant="primary"
          multiple
          className="flex-col md:flex-row gap-x-10 md:items-center flex-wrap"
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
            MODELS_CONTENT.modelCreation.trainingSettings.form.trainingType
              .label
          }
          withTooltip
          toolTipContent={
            MODELS_CONTENT.modelCreation.trainingSettings.form.trainingType
              .toolTip
          }
          required
        />
        <div className="flex flex-col md:flex-row md:items-center gap-4 w-full justify-between overflow-x-auto">
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
              MODELS_CONTENT.modelCreation.trainingSettings.form
                .advancedSettings.label
            }
            withTooltip
            toolTipContent={
              MODELS_CONTENT.modelCreation.trainingSettings.form
                .advancedSettings.toolTip
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
          <>
            <div className="flex items-center justify-between gap-4 flex-wrap lg:flex-nowrap">
              {advancedSettings
                .filter((setting) => setting.enabled)
                .map((setting, id) => (
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
                        FORM_VALIDATION_CONFIG[formData.baseModel][
                          setting.value
                        ].min
                      }
                      max={
                        // @ts-expect-error bad type definition
                        FORM_VALIDATION_CONFIG[formData.baseModel][
                          setting.value
                        ].max
                      }
                      handleInput={(e) => {
                        const inputValue = Number(e.target.value);

                        const min =
                          // @ts-expect-error bad type definition
                          FORM_VALIDATION_CONFIG[formData.baseModel][
                            setting.value
                          ].min;
                        const max =
                          // @ts-expect-error bad type definition
                          FORM_VALIDATION_CONFIG[formData.baseModel][
                            setting.value
                          ].max;
                        handleChange(setting.value, inputValue);
                        if (inputValue < min || inputValue > max) {
                          // Set validation message for out-of-range values
                          setValidationMessage(
                            `${setting.label} must be between ${min} and ${max}.`,
                          );
                          handleChange(
                            MODEL_CREATION_FORM_NAME.TRAINING_SETTINGS_IS_VALID,
                            false,
                          );
                        } else {
                          // Clear the validation message if the value is valid
                          setValidationMessage("");
                          handleChange(setting.value, inputValue);
                          handleChange(
                            MODEL_CREATION_FORM_NAME.TRAINING_SETTINGS_IS_VALID,
                            true,
                          );
                        }
                      }}
                      toolTipContent={setting.toolTip}
                    />
                  </div>
                ))}
            </div>
            <p className="text-sm text-primary">{validationMessage}</p>
          </>
        )}
      </div>
    </div>
  );
};

export default TrainingSettingsForm;
