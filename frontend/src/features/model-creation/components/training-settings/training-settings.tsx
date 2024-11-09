import { StepHeading } from "@/features/model-creation/components/";

import TrainingSettingsForm from "@/features/model-creation/components/training-settings/training-settings-form";
import { MODEL_CREATION_CONTENT } from "@/utils";

const TrainingSettingsStep = () => {
  return (
    <div className="flex flex-col gap-y-10 w-full">
      <StepHeading
        heading={MODEL_CREATION_CONTENT.trainingSettings.pageTitle}
        description={MODEL_CREATION_CONTENT.trainingSettings.pageDescription}
      />
      <TrainingSettingsForm />
    </div>
  );
};

export default TrainingSettingsStep;
