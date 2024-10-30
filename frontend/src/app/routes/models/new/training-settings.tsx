import { TrainingSettingsStep } from "@/features/model-creation/components";

export const CreateNewModelTrainingSettingsPage = () => {
  return (
    <div
      className={
        "col-start-3 col-span-7 flex flex-col gap-y-10 overflow-y-auto"
      }
    >
      <TrainingSettingsStep />
    </div>
  );
};
