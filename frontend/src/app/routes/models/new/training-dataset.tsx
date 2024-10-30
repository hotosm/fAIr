import { TrainingDatasetForm } from "@/features/model-creation/components";
import { TrainingDatasetOption } from "@/features/model-creation/components/training-dataset";
import { useState } from "react";

export const CreateNewModelTrainingDatasetPage = () => {
  const [selectedTrainingDatasetOption, setSelectedTrainingDatasetOption] =
    useState<TrainingDatasetOption>(TrainingDatasetOption.NONE);

  return (
    <div className={"col-start-3 col-span-8 flex flex-col gap-y-10"}>
      <TrainingDatasetForm
        setSelectedTrainingDatasetOption={setSelectedTrainingDatasetOption}
        selectedTrainingDatasetOption={selectedTrainingDatasetOption}
      />
    </div>
  );
};
