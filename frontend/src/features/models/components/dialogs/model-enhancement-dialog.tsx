import { Dialog } from "@/components/ui/dialog";
import { ChevronDownIcon } from "@/components/ui/icons";
import { useDialog } from "@/hooks/use-dialog";
import { APP_CONTENT, MODELS_BASE, MODELS_ROUTES } from "@/utils";
import ModelTrainingSettingsDialog from "@/features/models/components/dialogs/training-settings-dialog";
import { ModelsProvider } from "@/app/providers/models-provider";
import { useNavigate } from "react-router-dom";

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
      name: APP_CONTENT.models.modelsDetailsCard.modelEnhancement.newSettings
        .title,
      description:
        APP_CONTENT.models.modelsDetailsCard.modelEnhancement.newSettings
          .description,
      onClick: openDialog,
    },
    {
      name: APP_CONTENT.models.modelsDetailsCard.modelEnhancement.trainingData
        .title,
      description:
        APP_CONTENT.models.modelsDetailsCard.modelEnhancement.trainingData
          .description,
      onClick: () =>
        navigate(
          MODELS_BASE + "/" + modelId + "/" + MODELS_ROUTES.TRAINING_AREA,
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
        label={APP_CONTENT.models.modelsDetailsCard.modelUpdate.dialogHeading}
      >
        <ModelTrainingSettingsDialog
          isOpened={isTrainingSettingsDialogOpened}
          closeDialog={handleClose}
          modelId={modelId}
        />
        <ul className="flex flex-col gap-y-4 w-full">
          {options.map((option, id) => (
            <li
              key={`mode-enhancement-option-${id}`}
              className="border border-gray-border rounded-lg px-2 hover:border-primary flex items-center justify-between"
            >
              <button
                className="text-start transition-colors p-6"
                onClick={option.onClick}
              >
                <span className="flex flex-col gap-y-2">
                  <p className="text-dark text-body-1">{option.name}</p>
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
