import { ButtonWithIcon } from "@/components/ui/button";
import { ChevronDownIcon } from "@/components/ui/icons";
import { MODELS_BASE, MODELS_ROUTES } from "@/constants";
import { MODELS_CONTENT } from "@/constants";
import { TrainingDatasetOption } from "@/enums";
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
    handleChange,
    hasLabeledTrainingAreas,
    hasAOIsWithGeometry,
    getFullPath,
    handleModelCreationAndUpdate,
    handleTrainingDatasetCreation,
    trainingDatasetCreationInProgress,
    isEditMode,
  } = useModelsContext();

  const nextPage = () => {
    const nextRoute = getFullPath(pages[currentPageIndex + 1].path);
    if (currentPath.includes(MODELS_ROUTES.TRAINING_DATASET)) {
      if (formData.trainingDatasetOption === TrainingDatasetOption.CREATE_NEW) {
        handleTrainingDatasetCreation();
      } else {
        if (currentPageIndex < pages.length - 1) {
          navigate(nextRoute);
        }
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
    if (currentPageIndex > 0) {
      const prevRoute = getFullPath(pages[currentPageIndex - 1].path);
      // When going back, if it's the training dataset page and the user already selected an option previously, and not in edit mode,
      // Reset the selection to none so they can see the options again.
      if (
        !isEditMode &&
        currentPageIndex === 1 &&
        formData.trainingDatasetOption !== TrainingDatasetOption.NONE
      ) {
        handleChange(
          MODEL_CREATION_FORM_NAME.TRAINING_DATASET_OPTION,
          TrainingDatasetOption.NONE,
        );
        // When the user clicks the back button, all their changes will be lost. This is because if we don't clear it, the user can
        // be able to select existing dataset and also create a new one which will lead to confusion.
        // So it's safe to clear all changes to ensure that only one option will go through.
        handleChange(MODEL_CREATION_FORM_NAME.SELECTED_TRAINING_DATASET_ID, "");
        handleChange(MODEL_CREATION_FORM_NAME.DATASET_NAME, "");
        handleChange(MODEL_CREATION_FORM_NAME.TMS_URL, "");
        handleChange(MODEL_CREATION_FORM_NAME.TMS_URL_VALIDITY, {
          valid: false,
          message: "",
        });
      } else {
        navigate(prevRoute);
      }
    } else if (currentPath.includes(MODELS_ROUTES.DETAILS)) {
      navigate(MODELS_BASE);
    } else {
      navigate(-1);
    }
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
      // if the user hasn't selected any of the options, then they can not proceed to next page.
      if (
        !isEditMode &&
        formData.trainingDatasetOption === TrainingDatasetOption.NONE
      ) {
        return false;
      } else if (
        formData.trainingDatasetOption === TrainingDatasetOption.CREATE_NEW
      ) {
        // If the form submission is in progress or if any error disable the continue button.
        if (trainingDatasetCreationInProgress) {
          return true;
        }
        return (
          formData.tmsURLValidation.valid &&
          formData.datasetName.length >=
            FORM_VALIDATION_CONFIG[MODEL_CREATION_FORM_NAME.DATASET_NAME]
              .minLength
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
        variant="default"
        prefixIcon={ChevronDownIcon}
        label={MODELS_CONTENT.modelCreation.progressButtons.back}
        iconClassName="rotate-90"
        onClick={prevPage}
      />
      <ButtonWithIcon
        variant="primary"
        suffixIcon={ChevronDownIcon}
        label={
          trainingDatasetCreationInProgress
            ? "Loading..."
            : currentPath.includes(MODELS_ROUTES.MODEL_SUMMARY)
              ? "Submit"
              : MODELS_CONTENT.modelCreation.progressButtons.continue
        }
        iconClassName="-rotate-90"
        disabled={!canProceedToNextPage}
        onClick={nextPage}
      />
    </div>
  );
};

export default ProgressButtons;
