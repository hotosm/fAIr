import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { ButtonVariant } from "@/enums";

type TryFairWelcomeDialogProps = {
  isOpened: boolean;
  onContinue: () => void;
};

export const TryFairWelcomeDialog = ({
  isOpened,
  onContinue,
}: TryFairWelcomeDialogProps) => {
  
  return (
    <Dialog  isOpened={isOpened} closeDialog={() => null} preventClose noHeader>
      <div className="space-y-4">
        <h2 className="text-title-3 font-semibold text-dark">
          Welcome to Try fAIr
        </h2>
        <p className="text-body-3 text-grey">
          Explore what fAIr can detect in satellite imagery. Continue to zoom
          into the demo area and run your first prediction.
        </p>
        <Button
          variant={ButtonVariant.DARK}
          onClick={onContinue}
          className="!w-fit"
        >
          Continue
        </Button>
      </div>
    </Dialog>
  );
};
