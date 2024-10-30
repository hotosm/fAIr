import { CheckboxGroup, FormLabel, Input } from "@/components/ui/form";
import { useEffect, useMemo, useState } from "react";
import ChevronDownIcon from "@/components/ui/icons/chevron-down";
import { ButtonWithIcon } from "@/components/ui/button";
import {
  AdvancedGuageIcon,
  BasicGuageIcon,
  IntermediateGuageIcon,
} from "@/components/ui/icons";

enum TrainingType {
  BASIC = "Basic",
  INTERMEDIATE = "Intermediate",
  ADVANCED = "Advanced",
}

enum TrainingSettings {
  EPOCH = "epoch",
  CONTACT_SPACING = "contactSpacing",
  BATCH_SIZE = "batchSize",
  BOUNDARY_WIDTH = "boundaryWidth",
}

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
    value: TrainingSettings.EPOCH,
    toolTip: "Epochs for training",
  },
  {
    label: "Contact Spacing",
    value: TrainingSettings.BATCH_SIZE,
    toolTip: "Number of items per batch",
  },
  {
    label: "Batch Size",
    value: TrainingSettings.CONTACT_SPACING,
    toolTip: "Spacing between contacts",
  },
  {
    label: "Boundary Width",
    value: TrainingSettings.BOUNDARY_WIDTH,
    toolTip: "Width of the boundaries",
  },
];

const TrainingSettingsForm = () => {
  const [selectedTrainingType, setSelectedTrainingType] =
    useState<TrainingType>(TrainingType.BASIC);
  const [settings, setSettings] = useState(
    defaultTrainingSettings[TrainingType.BASIC],
  );
  const [showAdvancedSettings, setShowAdvancedSettings] =
    useState<boolean>(false);

  useEffect(() => {
    setSettings(defaultTrainingSettings[selectedTrainingType]);
  }, [selectedTrainingType]);

  const handleInputChange = (label: string, value: number) => {
    setSettings((prevSettings) => ({ ...prevSettings, [label]: value }));
  };

  const renderAdvancedSettings = useMemo(
    () => (
      <div className="flex items-center justify-between gap-x-4">
        {advancedSettings.map((setting, id) => (
          <div key={`training-settings-${id}`} className="max-w-40">
            <Input
              label={setting.label}
              labelWithTooltip
              type="number"
              showBorder
              value={settings[setting.value]}
              handleInput={(e) =>
                handleInputChange(setting.value, Number(e.target.value))
              }
              toolTipContent={setting.toolTip}
            />
          </div>
        ))}
      </div>
    ),
    [settings],
  );

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
          onCheck={() => null}
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
              onClick={() => setSelectedTrainingType(type.label)}
              label={type.label}
              variant={type.label === selectedTrainingType ? "dark" : "default"}
              capitalizeText={false}
              prefixIcon={type.Icon}
              iconClassName="md:icon-lg"
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-y-6">
        <div className="flex items-center gap-x-4">
          <FormLabel
            label="Advanced settings"
            withTooltip
            toolTipContent="content"
          />
          <button
            onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
          >
            <ChevronDownIcon
              className={`icon text-dark ${showAdvancedSettings && "rotate-180"}`}
            />
          </button>
        </div>
        {showAdvancedSettings && renderAdvancedSettings}
      </div>
    </div>
  );
};

export default TrainingSettingsForm;
