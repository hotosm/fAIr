import { ButtonWithIcon } from "@/components/ui/button";
import { ChevronDownIcon } from "@/components/ui/icons";
import { MODELS_ROUTES } from "@/constants";
import { MODELS_CONTENT } from "@/constants";
import { ButtonVariant, TrainingDatasetOption } from "@/enums";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FORM_VALIDATION_CONFIG,
  MODEL_CREATION_FORM_NAME,
  useModelsContext,
} from "@/app/providers/models-provider";

type ProgressButtonsProps = {
  currentPath: string;
  currentPageIndex: number;
  pages: { id: number; title: string; icon: React.ElementType; path: string }[];
};

const ProgressButtons: React.FC<ProgressButtonsProps> = ({
  pages,
  currentPageIndex,
  currentPath,
}) => {
  const navigate = useNavigate();

  const {
    formData,
    hasLabeledTrainingAreas,
    hasAOIsWithGeometry,
    getFullPath,
    handleModelCreationAndUpdate,
    modelCreationOrUpdateInProgress,
    isEditMode,
    isModelOwner,
  } = useModelsContext();

  const nextPage = () => {
    const nextRoute = getFullPath(pages[currentPageIndex + 1].path);
    if (currentPath.includes(MODELS_ROUTES.TRAINING_DATASET)) {
      if (currentPageIndex < pages.length - 1) {
        navigate(nextRoute);
      }
    } else if (currentPath.includes(MODELS_ROUTES.MODEL_SUMMARY)) {
      handleModelCreationAndUpdate();
    } else {
      if (currentPageIndex < pages.length - 1) {
        navigate(nextRoute);
      }
    }
  };

  const prevPage = () => {
    navigate(-1);
  };

  const canProceedToNextPage = useMemo(() => {
    // For the first page, the user must type at least some texts in the form data,
    // and they must be valid as well before the can be able to proceed to the next page.

    if (currentPath.includes(MODELS_ROUTES.DETAILS)) {
      return (
        formData.modelName.length >=
          FORM_VALIDATION_CONFIG[MODEL_CREATION_FORM_NAME.MODEL_NAME]
            .minLength &&
        formData.modelDescription.length >=
          FORM_VALIDATION_CONFIG[MODEL_CREATION_FORM_NAME.MODEL_DESCRIPTION]
            .minLength
      );
    } else if (currentPath.includes(MODELS_ROUTES.TRAINING_DATASET)) {
      if (formData.trainingDatasetOption === TrainingDatasetOption.CREATE_NEW) {
        return (
          formData.datasetName.length > 0 &&
          formData.tmsURL.length >=
            FORM_VALIDATION_CONFIG[MODEL_CREATION_FORM_NAME.DATASET_NAME]
              .minLength &&
          formData.selectedTrainingDatasetId
        );
      } else if (
        formData.trainingDatasetOption === TrainingDatasetOption.USE_EXISTING
      ) {
        // If selecting existing, ensure that a training dataset is selected
        return formData.selectedTrainingDatasetId && formData.tmsURL;
      } else {
        return true;
      }
    } else if (currentPath.includes(MODELS_ROUTES.TRAINING_SETTINGS)) {
      // confirm that the user has selected at least an option
      return formData.zoomLevels.length > 0 && formData.trainingSettingsIsValid;
    } else if (currentPath.includes(MODELS_ROUTES.TRAINING_AREA)) {
      return (
        hasLabeledTrainingAreas && hasAOIsWithGeometry && formData.oamBounds
      );
    } else {
      return true;
    }
  }, [formData, currentPath]);

  return (
    <div className="col-span-12 md:col-start-4 md:col-span-6 w-full flex items-center justify-between">
      <ButtonWithIcon
        variant={ButtonVariant.DEFAULT}
        prefixIcon={ChevronDownIcon}
        label={MODELS_CONTENT.modelCreation.progressButtons.back}
        iconClassName="rotate-90"
        onClick={prevPage}
        /**
         * If the user is not the owner of the model and they are in edit mode, then don't let them go back on
         * the training area page. Since the back page is training dataset, which they're not authorized to change.
         */
        disabled={
          !isModelOwner &&
          isEditMode &&
          currentPath.includes(MODELS_ROUTES.TRAINING_AREA)
        }
      />
      <ButtonWithIcon
        variant={ButtonVariant.PRIMARY}
        suffixIcon={ChevronDownIcon}
        label={
          modelCreationOrUpdateInProgress
            ? "Loading..."
            : currentPath.includes(MODELS_ROUTES.MODEL_SUMMARY)
              ? "Submit"
              : MODELS_CONTENT.modelCreation.progressButtons.continue
        }
        iconClassName="-rotate-90"
        disabled={!canProceedToNextPage || modelCreationOrUpdateInProgress}
        onClick={nextPage}
      />
    </div>
  );
};

export default ProgressButtons;
