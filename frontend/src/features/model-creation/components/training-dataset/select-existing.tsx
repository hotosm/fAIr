import { HelpText } from "@/components/ui/form";
import { MODELS_CONTENT } from "@/constants";
import {
  MODEL_CREATION_FORM_NAME,
  useModelsContext,
} from "@/app/providers/models-provider";
import { TTrainingDataset } from "@/types";
import { DatasetExplorer } from "@/components/shared/dataset-explorer";

const SelectExistingTrainingDatasetForm = () => {
  const { formData, handleChange } = useModelsContext();

  return (
    <div className="flex flex-col gap-y-10">
      <HelpText
        content={
          MODELS_CONTENT.modelCreation.trainingDataset.form
            .existingTrainingDatasetSectionDescription
        }
      />
      <DatasetExplorer
        selectedTrainingDatasetId={Number(formData.selectedTrainingDatasetId)}
        disableInstruction
        navigateOnClick={false}
        onDatasetSelect={(dataset: TTrainingDataset) => {
          handleChange(
            MODEL_CREATION_FORM_NAME.SELECTED_TRAINING_DATASET_ID,
            dataset.id
          );
          handleChange(MODEL_CREATION_FORM_NAME.DATASET_NAME, dataset.name);
          handleChange(
            MODEL_CREATION_FORM_NAME.TMS_URL,
            dataset.source_imagery
          );
        }}
      />
    </div>
  );
};

export default SelectExistingTrainingDatasetForm;
