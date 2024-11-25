import { ButtonWithIcon } from "@/components/ui/button";
import { StepHeading } from "@/features/model-creation/components/";
import { ChevronDownIcon } from "@/components/ui/icons";
import CreateNewTrainingDatasetForm from "@/features/model-creation/components/training-dataset/create-new";
import SelectExistingTrainingDatasetForm from "@/features/model-creation/components/training-dataset/select-existing";
import { TrainingDatasetOption } from "@/enums";
import {
  MODEL_CREATION_FORM_NAME,
  useModelsContext,
} from "@/app/providers/models-provider";
import { MODEL_CREATION_CONTENT } from "@/utils";

const TrainingDatasetForm = () => {
  const { handleChange, formData, isEditMode } = useModelsContext();

  return (
    <div className="flex flex-col gap-y-6 w-full">
      <StepHeading
        heading={
          isEditMode
            ? MODEL_CREATION_CONTENT.trainingDataset.editModePageTitle
            : MODEL_CREATION_CONTENT.trainingDataset.pageTitle
        }
        description={
          isEditMode
            ? MODEL_CREATION_CONTENT.trainingDataset.editModePageDescription
            : MODEL_CREATION_CONTENT.trainingDataset.pageDescription
        }
      />
      {formData.trainingDatasetOption === TrainingDatasetOption.NONE ? (
        <div className="flex flex-col gap-y-10 w-full">
          <ButtonWithIcon
            label={MODEL_CREATION_CONTENT.trainingDataset.buttons.createNew}
            suffixIcon={ChevronDownIcon}
            iconClassName="-rotate-90"
            variant={"dark"}
            capitalizeText={false}
            disabled={isEditMode}
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
            disabled={isEditMode}
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
