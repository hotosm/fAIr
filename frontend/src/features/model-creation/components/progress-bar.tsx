import { CheckIcon } from "@/components/ui/icons";
import { cn } from "@/utils";
import { useEffect, useRef } from "react";
import { useModelsContext } from "@/app/providers/models-provider";
import { useNavigate } from "react-router-dom";
import { MODELS_ROUTES } from "@/constants";

type ProgressBarProps = {
  currentPath: string;
  currentPageIndex: number;
  pages: { id: number; title: string; icon: React.ElementType; path: string }[];
};

const ProgressBar: React.FC<ProgressBarProps> = ({
  currentPath,
  currentPageIndex,
  pages,
}) => {
  const navigate = useNavigate();
  const { getFullPath, isModelOwner, isEditMode } = useModelsContext();
  const activeStepRef = useRef<HTMLButtonElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (activeStepRef.current && containerRef.current) {
      const container = containerRef.current;
      const activeStep = activeStepRef.current;

      const offset =
        activeStep.offsetLeft -
        container.offsetWidth / 2 +
        activeStep.offsetWidth / 2;
      container.scrollTo({
        left: offset,
        behavior: "smooth",
      });
    }
  }, [currentPath]);

  return (
    <div
      ref={containerRef}
      className="flex items-center justify-between w-full gap-x-4 overflow-x-auto p-1"
    >
      {pages.map((step, index) => {
        const activeStep = currentPath.includes(step.path);
        // Disable the confirmation page button from been clickable.
        const isLastPage = index === pages.length - 1;
        // Disable other buttons when the user is on the confirmation page.
        const isConfirmationPage = currentPath.includes(
          MODELS_ROUTES.CONFIRMATION,
        );
        // Disable the model details and training dataset if the user is not the owner of the model and if in edit mode.
        const disableButton =
          isLastPage ||
          isConfirmationPage ||
          (!isModelOwner && [0, 1].includes(index) && isEditMode);
        return (
          <button
            key={`current-form-progress-${step.id}`}
            ref={activeStep ? activeStepRef : null}
            className={`flex items-center gap-x-3 ${disableButton && "cursor-not-allowed"}`}
            disabled={disableButton}
            onClick={() => !isLastPage && navigate(getFullPath(step.path))}
          >
            {step.id < currentPageIndex + 1 ? (
              <span className="rounded-full bg-primary flex items-center justify-center w-9 h-9">
                <CheckIcon className="icon-lg text-primary bg-white rounded-full p-1" />
              </span>
            ) : (
              <span
                className={cn(
                  `rounded-full flex items-center justify-center w-9 h-9 ${
                    activeStep
                      ? "outline-dashed outline-2 outline-offset-2 outline-primary bg-primary"
                      : "bg-grey"
                  }`,
                )}
              >
                {<step.icon className="icon-lg text-white" />}
              </span>
            )}

            <span className="text-dark whitespace-nowrap">{step.title}</span>
          </button>
        );
      })}
    </div>
  );
};
export default ProgressBar;
