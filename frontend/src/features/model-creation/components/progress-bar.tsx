import { CloudIcon, DatabaseIcon, SettingsIcon, SquareShadowIcon, StarIcon, TagsIcon } from "@/components/ui/icons";
import CheckIcon from "@/components/ui/icons/check-icon";
import { cn } from "@/utils";

type ProgressBarProps = {
  currentStep: number;
  setCurrentStep: (currentStep: number) => void;
};

const steps: { title: string; icon: React.ElementType; id: number }[] = [
  {
    title: "Model Details",
    icon: TagsIcon,
    id: 1,
  },
  {
    title: "Training Dataset",
    icon: DatabaseIcon,
    id: 2,
  },
  {
    title: "Training Area",
    icon: SquareShadowIcon,
    id: 3,
  },
  {
    title: "Training Settings",
    icon: SettingsIcon,
    id: 4,
  },
  {
    title: "Submit Model",
    icon: CloudIcon,
    id: 5,
  },
  {
    title: "Confirmation",
    icon: StarIcon,
    id: 6,
  },
];
const ProgressBar: React.FC<ProgressBarProps> = ({
  currentStep,
  setCurrentStep,
}) => {
  return (
    <div className="flex items-center justify-between px-10">
      {steps.map((step) => {
        const activeStep = step.id === currentStep;
        return (
          <button
            className="flex items-center gap-x-3 cursor-pointer"
            onClick={() => setCurrentStep(step.id)}
          >
            {step.id < currentStep ? (
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
