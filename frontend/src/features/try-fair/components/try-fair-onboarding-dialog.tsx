import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { ButtonVariant } from "@/enums";
import {
  YouTubePlayIcon,
  SparklesIcon,
  ArrowMoveIcon,
} from "@/components/ui/icons";
import { useState } from "react";
import { cn } from "@/utils";

type TryFairOnboardingDialogProps = {
  isOpened: boolean;
  onContinue: () => void;
  handleSkipOnboarding: () => void;
};

const onboardingSteps = [
  {
    title: "Choose a Model",
    description:
      "Select an AI model based on what you want to detect in the imagery.",
    icon: SparklesIcon,
    image: "/onboarding/select-model.gif",
  },
  {
    title: "Select an Area",
    description:
      "Move the map until the red box covers the area you want to analyze.",
    icon: ArrowMoveIcon,
    image: "/onboarding/select-area.gif",
  },
  {
    title: "Run Detection",
    description:
      "Click Start Mapping and we'll take you to a sample area where you can try your first AI prediction.",
    icon: YouTubePlayIcon,
    image: "/onboarding/run-model.gif",
  },
];

export const TryFairOnboardingDialog = ({
  isOpened,
  onContinue,
  handleSkipOnboarding,
}: TryFairOnboardingDialogProps) => {
  const [step, setStep] = useState(0);

  const isLastStep = step === onboardingSteps.length - 1;

  const handleNext = () => {
    if (!isLastStep) {
      setStep((prev) => prev + 1);
      return;
    }
    onContinue();
  };

  const currentStep = onboardingSteps[step];
  const StepIcon = currentStep.icon;

  return (
    <Dialog
      isOpened={isOpened}
      closeDialog={() => null}
      preventClose
      label="Welcome to fAIr"
    >
      <div className="space-y-6">
        <div className="space-y-2">
          <p className="text-md text-muted-foreground">
            Use AI models to detect features in satellite imagery. It only takes
            a few seconds to get your first result.
          </p>
        </div>

        <div className="overflow-hidden rounded-xl border bg-muted/30">
          <img
            src={currentStep.image}
            alt={currentStep.title}
            className="h-56 w-full object-cover"
          />
        </div>

        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <StepIcon className="h-5 w-5 text-primary" />
          </div>

          <div>
            <h3 className="font-medium">{currentStep.title}</h3>

            <p className="mt-1 text-sm text-muted-foreground">
              {currentStep.description}
            </p>
          </div>
        </div>

        <div className="flex justify-center gap-2">
          {onboardingSteps.map((_, index) => (
            <div
              key={index}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                index === step
                  ? "w-8 bg-primary"
                  : "w-2 bg-muted-foreground/30",
              )}
            />
          ))}
        </div>

        <div className="flex items-center justify-between">
          <Button
            variant={ButtonVariant.NONE}
            onClick={handleSkipOnboarding}
            className="!w-fit"
          >
            Skip
          </Button>

          <Button
            variant={ButtonVariant.PRIMARY}
            rounded
            onClick={handleNext}
            className="!w-fit"
          >
            {isLastStep ? "Start Mapping" : "Next"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
