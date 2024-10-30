import { Head } from "@/components/seo";
import { ButtonWithIcon } from "@/components/ui/button";
import ChevronDownIcon from "@/components/ui/icons/chevron-down";
import { ProgressBar } from "@/features/model-creation/components";
import {
  ModelDetailsForm,
  TrainingDatasetForm,
  TrainingAreaForm,
} from "@/features/model-creation/components/steps";
import { TrainingDatasetOption } from "@/features/model-creation/components/steps/training-dataset/training-dataset";
import { useState } from "react";

export const ModelCreationPage = () => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedTrainingDatasetOption, setSelectedTrainingDatasetOption] =
    useState<TrainingDatasetOption>(TrainingDatasetOption.NONE);
  // @ts-expect-error declared but never read
  const [formData, setFormData] = useState({
    modelName: "",
    modelDescription: "",
    baseModel: "",
    existingTrainingDatasetId: "",
    newTrainingDataset: {
      name: "",
      tmsLink: "",
    },
    modelTrainingType: "",
    zoomLevels: [],
    epochs: 0,
    contactSpacing: 0,
    boundaryWidth: 0,
    batchSize: 0,
  });

  const handleNextStep = () => {
    // todo handle form validation before going next
    setCurrentStep((prev) => prev + 1);
  };

  const handlePreviousStep = () => {
    // todo handle form validation before going next
    if (
      currentStep === 2 &&
      selectedTrainingDatasetOption !== TrainingDatasetOption.NONE
    ) {
      setCurrentStep(2);
      setSelectedTrainingDatasetOption(TrainingDatasetOption.NONE);
    } else {
      setCurrentStep((prev) => prev - 1);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-12 w-full justify-center my-20">
      <Head title="Create New Model" />
      {/* Steps */}
      <div className="col-start-2 col-span-10 w-full">
        <ProgressBar
          currentStep={currentStep}
          setCurrentStep={setCurrentStep}
        />
      </div>
      <div
        className={` ${currentStep === 3 ? "col-span-12" : "col-start-3 col-span-7"} flex flex-col gap-y-10`}
      >
        <div className="w-full h-full">
          {currentStep === 1 && <ModelDetailsForm />}
          {currentStep === 2 && (
            <TrainingDatasetForm
              setSelectedTrainingDatasetOption={
                setSelectedTrainingDatasetOption
              }
              selectedTrainingDatasetOption={selectedTrainingDatasetOption}
            />
          )}
          {currentStep === 3 && <TrainingAreaForm />}
        </div>
        <div className="flex items-center justify-between">
          <ButtonWithIcon
            variant="default"
            prefixIcon={ChevronDownIcon}
            label="Back"
            iconClassName="rotate-90"
            disabled={currentStep === 1}
            onClick={handlePreviousStep}
          />
          <ButtonWithIcon
            variant="primary"
            suffixIcon={ChevronDownIcon}
            label="Continue"
            iconClassName="-rotate-90"
            disabled={
              currentStep === 6 ||
              (currentStep === 2 &&
                selectedTrainingDatasetOption === TrainingDatasetOption.NONE)
            }
            onClick={handleNextStep}
          />
        </div>
      </div>
    </div>
  );
};
