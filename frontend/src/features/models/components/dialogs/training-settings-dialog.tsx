import { ButtonWithIcon } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { ChevronDownIcon } from "@/components/ui/icons";
import { SHOELACE_SIZES } from "@/enums";
import TrainingSettingsForm from "@/features/model-creation/components/training-settings/training-settings-form";
import useScreenSize from "@/hooks/use-screen-size";
import { APP_CONTENT } from "@/utils";
import { useModelDetails } from "../../hooks/use-models";

type ModelEnhancementDialogProps = {
  isOpened: boolean;
  closeDialog: () => void;
  modelId: string
};


const ModelTrainingSettingsDialog: React.FC<ModelEnhancementDialogProps> = ({
  isOpened,
  closeDialog,
  modelId
}) => {
  const { isLaptop, isMobile, isTablet } = useScreenSize();
  // get model details with the id
  const { data, isPending, isError } = useModelDetails(modelId);

  // Training enhancement can only happen in two places
  // When the user is on the confirmation page or on the model card page.
  // In either page, after successful enhancement, redirect the user to the model card page to see the training settings.
  // If they're on the confirmation page, the redirection will be obvious, but it won't on the model card, since they're on the page already.
  // If the training is not successful, they'll remain on their current page, so they can try again.

  return (
    <Dialog
      isOpened={isOpened}
      closeDialog={closeDialog}
      labelColor="primary"
      label={APP_CONTENT.models.modelsDetailsCard.trainingSettings.dialogHeading}
      size={isMobile || isTablet ? SHOELACE_SIZES.EXTRA_LARGE : isLaptop ? SHOELACE_SIZES.LARGE : SHOELACE_SIZES.MEDIUM}
    >
      {
        isError ? <p>Error retrieving model details</p> :
          isPending ? <div className="h-40 w-full animate-pulse bg-light-gray"></div> :
            <div className="flex flex-col gap-y-6 w-full">
              <p className="text-gray">{APP_CONTENT.models.modelsDetailsCard.trainingSettings.description}</p>
              <h1 className="text-title-3 lg:text-title-1 font-semibold">{data.name}</h1>
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
      }

    </Dialog>

  );
};

export default ModelTrainingSettingsDialog;
