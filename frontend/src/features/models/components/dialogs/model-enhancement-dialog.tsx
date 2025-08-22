import { useNavigate } from "react-router-dom";

import { ModelsProvider } from "@/app/providers/models-provider";
import { Dialog } from "@/components/ui/dialog";
import { ChevronDownIcon } from "@/components/ui/icons";
import { MODELS_BASE, MODELS_CONTENT, MODELS_ROUTES } from "@/constants";
import ModelTrainingSettingsDialog from "@/features/models/components/dialogs/training-settings-dialog";
import { useDialog } from "@/hooks/use-dialog";

type ModelEnhancementDialogProps = {
  isOpened: boolean;
  closeDialog: () => void;
  modelId: string;
};
const ModelEnhancementDialog: React.FC<ModelEnhancementDialogProps> = ({
  isOpened,
  closeDialog,
  modelId,
}) => {
  const {
    isOpened: isTrainingSettingsDialogOpened,
    openDialog,
    closeDialog: closeTrainingSettingsDialog,
  } = useDialog();
  const navigate = useNavigate();

  const options = [
    {
      name: MODELS_CONTENT.models.modelsDetailsCard.modelEnhancement.newSettings
        .title,
      description:
        MODELS_CONTENT.models.modelsDetailsCard.modelEnhancement.newSettings
          .description,
      onClick: openDialog,
    },
    {
      name: MODELS_CONTENT.models.modelsDetailsCard.modelEnhancement
        .trainingData.title,
      description:
        MODELS_CONTENT.models.modelsDetailsCard.modelEnhancement.trainingData
          .description,
      onClick: () =>
        navigate(
          MODELS_BASE + "/" + modelId + "/" + MODELS_ROUTES.TRAINING_AREA
        ),
    },
  ];

  const handleClose = () => {
    closeDialog();
    closeTrainingSettingsDialog();
  };

  return (
    <ModelsProvider>
      <Dialog
        isOpened={isOpened}
        closeDialog={closeDialog}
        label={
          MODELS_CONTENT.models.modelsDetailsCard.modelUpdate.dialogHeading
        }
      >
        <ModelTrainingSettingsDialog
          isOpened={isTrainingSettingsDialogOpened}
          closeDialog={handleClose}
          modelId={modelId}
        />
        <ul className="flex w-full flex-col gap-y-4">
          {options.map((option, id) => (
            <li
              key={`mode-enhancement-option-${id}`}
              className="flex items-center justify-between rounded-lg border border-gray-border px-2 hover:border-primary"
            >
              <button
                className="p-6 text-start transition-colors"
                onClick={option.onClick}
              >
                <span className="flex flex-col gap-y-2">
                  <p className="text-body-1 text-dark">{option.name}</p>
                  <p className="text-gray text-body-3">{option.description}</p>
                </span>
              </button>
              <ChevronDownIcon className="icon -rotate-90" />
            </li>
          ))}
        </ul>
      </Dialog>
    </ModelsProvider>
  );
};

export default ModelEnhancementDialog;
