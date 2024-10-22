import { Head } from "@/components/seo";
import { ButtonWithIcon } from "@/components/ui/button";
import ChevronDownIcon from "@/components/ui/icons/chevron-down";
import { ProgressBar } from "@/features/model-creation/components";
import { useState } from "react";

export const ModelCreationPage = () => {
  const [currentStep, setCurrentStep] = useState<number>(1);

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
    setCurrentStep((prev) => prev - 1);
  };
  return (
    <div className="min-h-screen grid grid-cols-12 w-full justify-center">
      <Head title="Create New Model" />
      {/* Steps */}
      <div className="col-start-2 col-span-10 w-full mt-20">
        <ProgressBar
          currentStep={currentStep}
          setCurrentStep={setCurrentStep}
        />
      </div>
      <div className="col-start-3 col-span-8 flex flex-col gap-y-10">
        <div className="flex items-center justify-center w-full h-[700px] bg-red-500">
          Components and steps
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
            disabled={currentStep === 6}
            onClick={handleNextStep}
          />
        </div>
      </div>
    </div>
  );
};
