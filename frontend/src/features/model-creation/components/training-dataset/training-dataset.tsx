import { ButtonWithIcon } from "@/components/ui/button";
import { StepHeading } from "@/features/model-creation/components/";
import { ChevronDownIcon } from "@/components/ui/icons";
import CreateNewTrainingDatasetForm from "@/features/model-creation/components/training-dataset/create-new";
import SelectExistingTrainingDatasetForm from "@/features/model-creation/components/training-dataset/select-existing";
import { TrainingDatasetOption } from "@/enums";
import {
  MODEL_CREATION_FORM_NAME,
  useModelFormContext,
} from "@/app/providers/model-creation-provider";

const TrainingDatasetForm = () => {
  const { handleChange, formData } = useModelFormContext();

  return (
    <div className="flex flex-col gap-y-6 w-full">
      <StepHeading
        heading="Training Dataset"
        description=" Lorem ipsum dolor sit amet, consectetur adipisicing elit. Id fugit
        ducimus harum debitis deserunt cum quod quam rerum aliquid. Quibusdam
        sequi incidunt quasi delectus laudantium accusamus modi omnis maiores.
        Incidunt!"
      />
      {formData.trainingDatasetOption === TrainingDatasetOption.NONE ? (
        <div className="flex flex-col gap-y-10 w-full">
          <ButtonWithIcon
            label="Create a New Training Dataset"
            suffixIcon={ChevronDownIcon}
            iconClassName="-rotate-90"
            variant={"dark"}
            capitalizeText={false}
            onClick={() =>
              handleChange(
                MODEL_CREATION_FORM_NAME.TRAINING_DATASET_OPTION,
                TrainingDatasetOption.CREATE_NEW,
              )
            }
          ></ButtonWithIcon>
          <ButtonWithIcon
            label="Select from Existing Training Dataset"
            suffixIcon={ChevronDownIcon}
            iconClassName="-rotate-90"
            capitalizeText={false}
            onClick={() =>
              handleChange(
                MODEL_CREATION_FORM_NAME.TRAINING_DATASET_OPTION,
                TrainingDatasetOption.USE_EXISTING,
              )
            }
            variant={"default"}
          ></ButtonWithIcon>
        </div>
      ) : null}

      {/* Forms */}
      {formData.trainingDatasetOption === TrainingDatasetOption.CREATE_NEW ? (
        <CreateNewTrainingDatasetForm />
      ) : null}

      {formData.trainingDatasetOption === TrainingDatasetOption.USE_EXISTING ? (
        <SelectExistingTrainingDatasetForm />
      ) : null}
    </div>
  );
};

export default TrainingDatasetForm;
