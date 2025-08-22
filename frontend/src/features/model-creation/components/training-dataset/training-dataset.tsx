import CreateNewTrainingDatasetForm from "@/features/model-creation/components/training-dataset/create-new";
import SelectExistingTrainingDatasetForm from "@/features/model-creation/components/training-dataset/select-existing";
import { MODELS_CONTENT } from "@/constants";
import { StepHeading } from "@/features/model-creation/components/";
import { TrainingDatasetOption } from "@/enums";
import {
  MODEL_CREATION_FORM_NAME,
  useModelsContext,
} from "@/app/providers/models-provider";
import { useCallback } from "react";
import { TabGroup } from "@/components/ui/tab-group";

const TrainingDatasetForm = () => {
  const { handleChange, formData } = useModelsContext();

  const resetFormState = useCallback(() => {
    handleChange(MODEL_CREATION_FORM_NAME.SELECTED_TRAINING_DATASET_ID, "");
    handleChange(MODEL_CREATION_FORM_NAME.DATASET_NAME, "");
    handleChange(MODEL_CREATION_FORM_NAME.TMS_URL, "");
    handleChange(MODEL_CREATION_FORM_NAME.TMS_URL_VALIDITY, {
      valid: false,
      message: "",
    });
  }, []);

  return (
    <div className="flex flex-col gap-y-6 w-full">
      <StepHeading
        heading={MODELS_CONTENT.modelCreation.trainingDataset.pageTitle}
        description={
          MODELS_CONTENT.modelCreation.trainingDataset.pageDescription
        }
      />
      {/* Tabs Switcher */}
      <TabGroup
        tabs={[
          TrainingDatasetOption.USE_EXISTING,
          TrainingDatasetOption.CREATE_NEW,
        ]}
        activeTab={formData.trainingDatasetOption}
        setActiveTab={(tab) => {
          handleChange(MODEL_CREATION_FORM_NAME.TRAINING_DATASET_OPTION, tab);
          resetFormState();
        }}
      />

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
