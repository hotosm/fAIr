import { useModelsContext } from "@/app/providers/models-provider";
import { CheckIcon } from "@/components/ui/icons";
import { cn } from "@/utils";
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

type ProgressBarProps = {
  currentPath: string;
  currentPageIndex: number;
  pages: { id: number; title: string; icon: React.ElementType; path: string }[];
};

const ProgressBar: React.FC<ProgressBarProps> = ({ currentPath, currentPageIndex, pages }) => {
  const navigate = useNavigate();
  const { getFullPath, isEditMode } = useModelsContext();
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
        const isLastPage = index === pages.length - 1;
        return (
          <button
            key={`current-form-progress-${step.id}`}
            ref={activeStep ? activeStepRef : null}
            className="flex items-center gap-x-3 cursor-pointer"
            disabled={isLastPage}
            onClick={() =>
              isEditMode && !isLastPage && navigate(getFullPath(step.path))
            }
          >
            {step.id < currentPageIndex + 1 ? (
              <span className="rounded-full bg-primary flex items-center justify-center w-9 h-9">
                <CheckIcon className="icon-lg text-primary bg-white rounded-full p-1" />
              </span>
            ) : (
              <span
                className={cn(
                  `rounded-full flex items-center justify-center w-9 h-9 ${activeStep
                    ? "outline-dashed outline-2 outline-offset-2 outline-primary bg-primary"
                    : "bg-gray"
                  }`,
                )}
              >
                {<step.icon className="icon-lg text-white" />}
              </span>
            )}

            <span className="text-gray whitespace-nowrap">{step.title}</span>
          </button>
        );
      })}
    </div>
  );
};
export default ProgressBar;
