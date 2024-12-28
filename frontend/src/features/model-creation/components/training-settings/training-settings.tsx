import { StepHeading } from "@/features/model-creation/components/";

import TrainingSettingsForm from "@/features/model-creation/components/training-settings/training-settings-form";
import { MODELS_CONTENT } from "@/constants";

const TrainingSettingsStep = () => {
  return (
    <div className="flex flex-col gap-y-10 w-full">
      <StepHeading
        heading={MODELS_CONTENT.modelCreation.trainingSettings.pageTitle}
        description={
          MODELS_CONTENT.modelCreation.trainingSettings.pageDescription
        }
      />
      <TrainingSettingsForm />
    </div>
  );
};

export default TrainingSettingsStep;
