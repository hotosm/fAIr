import { ButtonWithIcon } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { ChevronDownIcon } from "@/components/ui/icons";
import { SHOELACE_SIZES } from "@/enums";
import TrainingSettingsForm from "@/features/model-creation/components/training-settings/training-settings-form";
import useScreenSize from "@/hooks/use-screen-size";
import { APP_CONTENT } from "@/utils";

type ModelEnhancementDialogProps = {
  isOpened: boolean;
  closeDialog: () => void;
};


const ModelTrainingSettingsDialog: React.FC<ModelEnhancementDialogProps> = ({
  isOpened,
  closeDialog,
}) => {
  const { isLaptop, isMobile, isTablet } = useScreenSize()

  return (
    <Dialog
      isOpened={isOpened}
      closeDialog={closeDialog}
      labelColor="primary"
      label={APP_CONTENT.models.modelsDetailsCard.trainingSettings.dialogHeading}
      size={isMobile || isTablet ? SHOELACE_SIZES.EXTRA_LARGE : isLaptop ? SHOELACE_SIZES.LARGE : SHOELACE_SIZES.MEDIUM}
    >
      <div className="flex flex-col gap-y-6 w-full">
        <p className="text-gray">{APP_CONTENT.models.modelsDetailsCard.trainingSettings.description}</p>
        <h1 className="text-title-3 lg:text-title-1 font-semibold">Model Name O</h1>
        <TrainingSettingsForm />
        <div className="self-end">
          <ButtonWithIcon
            variant="primary"
            suffixIcon={ChevronDownIcon}
            label={
              APP_CONTENT.models.modelsDetailsCard.trainingSettings.submitButtonText
            }
            iconClassName="-rotate-90"
          />
        </div>
      </div>
    </Dialog>

  );
};

export default ModelTrainingSettingsDialog;
