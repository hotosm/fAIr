import CheckIcon from "@/components/ui/icons/check-icon";
import { cn } from "@/utils";
import { memo, useEffect, useRef } from "react";

type ProgressBarProps = {
  currentPath: string;
  currentPageIndex: number;
  pages: { id: number; title: string; icon: React.ElementType; path: string }[];
};

const ProgressBar: React.FC<ProgressBarProps> = memo(
  ({ currentPath, currentPageIndex, pages }) => {
    const activeStepRef = useRef<HTMLButtonElement | null>(null);

    useEffect(() => {
      if (activeStepRef.current) {
        activeStepRef.current.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "center",
        });
      }
    }, [currentPageIndex]);

    return (
      <div className="flex items-center justify-between w-full gap-x-4 overflow-x-auto px-1 py-3">
        {pages.map((step) => {
          const activeStep = currentPath.includes(step.path);
          return (
            <button
              key={`current-form-progress-${step.id}`}
              ref={activeStep ? activeStepRef : null} // Attach ref to the active step
              className="flex items-center gap-x-3 cursor-pointer"
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
  },
);

export default ProgressBar;
