import { useAppTour } from "@/app/providers/tour-provider";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { ButtonVariant } from "@/enums";

export const TrainingAreaTourDialog = () => {
  const {
    startTrainingAreaTour,
    stopTrainingAreaTour,
    showTourModal,
    setShowTourModal,
  } = useAppTour();

  return (
    <Dialog
      isOpened={showTourModal}
      label="Welcome to Training Area"
      closeDialog={() => setShowTourModal(false)}
      preventClose
    >
      <p className="mb-4">
        This is where you'll define the specific geographical area for your AI
        model to analyze. Follow this quick tour to learn how to use this
        section effectively.
      </p>
      <nav
        className="flex flex-col md:flex-row gap-4 w-full"
        aria-label="Tour navigation"
      >
        <Button
          variant={ButtonVariant.DEFAULT}
          onClick={stopTrainingAreaTour}
          className="!w-fit"
        >
          Skip tour
        </Button>
        <Button
          variant={ButtonVariant.DARK}
          onClick={startTrainingAreaTour}
          className="!w-fit"
        >
          Start tour
        </Button>
      </nav>
    </Dialog>
  );
};
