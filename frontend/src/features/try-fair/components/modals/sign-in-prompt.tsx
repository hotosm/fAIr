import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ButtonVariant, SHOELACE_SIZES } from "@/enums";
import { CautionIcon } from "@/components/ui/icons/caution-icon";
import { HANKO_URL } from "@/config";

/**
 * Prompt shown when an unauthenticated user tries to map a large area
 * on the Try fAIr page.
 */
export const SignInPromptDialog = ({
  isOpened,
  closeDialog,
}: {
  isOpened: boolean;
  closeDialog: () => void;
}) => {
  const handleHankoLogin = () => {
    window.location.href = `${HANKO_URL}/app?return_to=${encodeURIComponent(window.location.href)}`;
  };

  return (
    <Dialog
      isOpened={isOpened}
      closeDialog={closeDialog}
      noHeader
      borderRadius="rounded"
      size={SHOELACE_SIZES.SMALL}
    >
      <div className="flex flex-col space-y-8 items-center p-4  text-center">
        <div className="flex justify-center items-center">
          <CautionIcon />
        </div>

        <p className="text-dark text-lg text-center">
          You must sign in to map a large area.
        </p>

        <div className="flex items-center justify-between gap-3">
          <Button
            variant={ButtonVariant.TERTIARY}
            size="medium"
            rounded
            className="!bg-[#6B7280] !text-white"
            onClick={closeDialog}
          >
            Cancel
          </Button>
          <Button rounded size="medium" onClick={handleHankoLogin}>
            Sign In
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
