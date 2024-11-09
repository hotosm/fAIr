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
import { MODEL_CREATION_CONTENT } from "@/utils";

const TrainingDatasetForm = () => {
  const { handleChange, formData } = useModelFormContext();

  return (
    <div className="flex flex-col gap-y-6 w-full">
      <StepHeading
        heading={MODEL_CREATION_CONTENT.trainingDataset.pageTitle}
        description={MODEL_CREATION_CONTENT.trainingDataset.pageDescription}
      />
      {formData.trainingDatasetOption === TrainingDatasetOption.NONE ? (
        <div className="flex flex-col gap-y-10 w-full">
          <ButtonWithIcon
            label={MODEL_CREATION_CONTENT.trainingDataset.buttons.createNew}
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
            label={
              MODEL_CREATION_CONTENT.trainingDataset.buttons.selectExisting
            }
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
