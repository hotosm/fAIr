import { StepHeading } from "@/features/model-creation/components/";

import TrainingSettingsForm from "@/features/model-creation/components/training-settings/training-settings-form";

const TrainingSettingsStep = () => {
  return (
    <div className="flex flex-col gap-y-10 w-full">
      <StepHeading
        heading="Model Training Settings"
        description=" Lorem ipsum dolor sit amet, consectetur adipisicing elit. Id fugit
        ducimus harum debitis deserunt cum quod quam rerum aliquid. Quibusdam
        sequi incidunt quasi delectus laudantium accusamus modi omnis maiores.
        Incidunt!"
      />
      <TrainingSettingsForm />
    </div>
  );
};

export default TrainingSettingsStep;
