import CheckIcon from "@/components/ui/icons/check-icon";
import { APPLICATION_ROUTES, cn } from "@/utils";
import { useNavigate } from "react-router-dom";

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

  return (
    <div className="flex items-center justify-between px-10">
      {pages.map((step) => {
        const activeStep = step.path === currentPath;
        return (
          <button
            key={`current-form-progress-${step.id}`}
            className="flex items-center gap-x-3 cursor-pointer"
            disabled={
              step.path === APPLICATION_ROUTES.CREATE_NEW_MODEL_CONFIRMATION
            }
            onClick={() => navigate(step.path)}
          >
            {step.id < currentPageIndex + 1 ? (
              <span className="rounded-full bg-primary flex items-center justify-center w-9 h-9">
                <CheckIcon className="icon-lg text-primary bg-white rounded-full p-1" />
              </span>
            ) : (
              <span
                className={cn(
                  `rounded-full flex items-center justify-center w-9 h-9 ${activeStep ? "outline-dashed outline-2 outline-offset-2 outline-primary bg-primary" : "bg-gray"}`,
                )}
              >
                {<step.icon className="icon-lg text-white" />}
              </span>
            )}

            <span className="text-gray">{step.title}</span>
          </button>
        );
      })}
    </div>
  );
};

export default ProgressBar;
