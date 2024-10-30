import {
  FORM_VALIDATION_CONFIG,
  MODEL_CREATION_FORM_NAME,
  useModelFormContext,
} from "@/app/providers/model-creation-provider";
import { ButtonWithIcon } from "@/components/ui/button";
import { ChevronDownIcon } from "@/components/ui/icons";
import { APPLICATION_ROUTES } from "@/utils";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

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

  const { formData } = useModelFormContext();

  const nextPage = () => {
    // Confirm the form is submitted successfully before showing confirmation page.
    if (currentPageIndex < pages.length - 1) {
      navigate(pages[currentPageIndex + 1].path);
    }
  };

  const prevPage = () => {
    if (currentPageIndex > 0) {
      navigate(pages[currentPageIndex - 1].path);
    }
  };

  const canProceedToNextPage = useMemo(() => {
    // For the first page, the user must type at least some texts in the form data,
    // and they must be valid as well before the can be able to proceed to the next page.
    if (currentPath === APPLICATION_ROUTES.CREATE_NEW_MODEL) {
      return (
        formData.modelName.length >=
          FORM_VALIDATION_CONFIG[MODEL_CREATION_FORM_NAME.MODEL_NAME]
            .minLength &&
        formData.modelDescription.length >=
          FORM_VALIDATION_CONFIG[MODEL_CREATION_FORM_NAME.MODEL_DESCRIPTION]
            .minLength
      );
    }
    return true;
  }, [formData]);

  return (
    <div className="col-start-4 col-span-6 w-full flex items-center justify-between">
      <ButtonWithIcon
        variant="default"
        prefixIcon={ChevronDownIcon}
        label="Back"
        iconClassName="rotate-90"
        disabled={currentPath === APPLICATION_ROUTES.CREATE_NEW_MODEL}
        onClick={prevPage}
      />
      <ButtonWithIcon
        variant="primary"
        suffixIcon={ChevronDownIcon}
        label={
          currentPath === APPLICATION_ROUTES.CREATE_NEW_MODEL_SUMMARY
            ? "Submit"
            : "Continue"
        }
        iconClassName="-rotate-90"
        disabled={!canProceedToNextPage}
        onClick={nextPage}
      />
    </div>
  );
};

export default ProgressButtons;
