import { ButtonWithIcon } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { ChevronDownIcon } from "@/components/ui/icons";
import TrainingSettingsForm from "@/features/model-creation/components/training-settings/training-settings-form";
import { APP_CONTENT } from "@/utils";
import { useModelDetails } from "@/features/models/hooks/use-models";
import {
  MODEL_CREATION_FORM_NAME,
  useModelsContext,
} from "@/app/providers/models-provider";
import { useEffect } from "react";
import { PAGE_LIMIT } from "@/components/pagination";
import { useTrainingHistory } from "@/features/models/hooks/use-training";

type ModelEnhancementDialogProps = {
  isOpened: boolean;
  closeDialog: () => void;
  modelId: string;
};

const ModelTrainingSettingsDialog: React.FC<ModelEnhancementDialogProps> = ({
  isOpened,
  closeDialog,
  modelId,
}) => {
  const { data, isPending, isError } = useModelDetails(modelId);

  const { handleChange, formData, createNewTrainingRequestMutation } =
    useModelsContext();

  {
    /*  
    Update the base model in the state since it's required for enabling/disabling some advanced settings. 
  */
  }
  useEffect(() => {
    if (!data) return;
    handleChange(
      MODEL_CREATION_FORM_NAME.BASE_MODELS,
      data?.base_model as string,
    );
  }, [data?.base_model]);

  const disableButton = formData.zoomLevels.length === 0;
  const { refetch: refetchTrainingHistory } = useTrainingHistory(
    modelId as string,
    0,
    PAGE_LIMIT,
    "-id",
  );

  const handleClick = () => {
    createNewTrainingRequestMutation.mutate(
      {
        model: modelId,
        input_boundary_width: formData.boundaryWidth,
        input_contact_spacing: formData.contactSpacing,
        epochs: formData.epoch,
        batch_size: formData.batchSize,
        zoom_level: formData.zoomLevels,
      },
      {
        onSuccess: () => {
          refetchTrainingHistory();
          closeDialog();
        },
        onError: () => {
          closeDialog();
        },
      },
    );
  };

  return (
    <Dialog
      isOpened={isOpened}
      closeDialog={closeDialog}
      labelColor="primary"
      label={
        APP_CONTENT.models.modelsDetailsCard.trainingSettings.dialogHeading
      }
    >
      {isError ? (
        <p>Error retrieving model details</p>
      ) : isPending ? (
        <div className="h-40 w-full animate-pulse bg-light-gray"></div>
      ) : (
        <div className="flex flex-col gap-y-6 w-full">
          <p className="text-gray">
            {APP_CONTENT.models.modelsDetailsCard.trainingSettings.description}
          </p>
          <h1 className="text-title-3 lg:text-title-1 font-semibold">
            {data.name}
          </h1>
          <TrainingSettingsForm />
          <div className="self-end">
            <ButtonWithIcon
              disabled={disableButton}
              variant="primary"
              suffixIcon={ChevronDownIcon}
              onClick={handleClick}
              label={
                APP_CONTENT.models.modelsDetailsCard.trainingSettings
                  .submitButtonText
              }
              iconClassName="-rotate-90"
            />
          </div>
        </div>
      )}
    </Dialog>
  );
};

export default ModelTrainingSettingsDialog;
