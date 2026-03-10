import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { ButtonVariant } from "@/enums";

type ConfirmationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  message: string;
  icon: React.ReactNode;
  isConfirming?: boolean;
  confirmLabel?: string;
  cancelLabel?: string;
};

export const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  message,
  icon,
  isConfirming = false,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
}: ConfirmationModalProps) => {
  if (!isOpen) return null;

  return (
    <Dialog
      isOpened={isOpen}
      closeDialog={onClose}
      preventClose={isConfirming}
      noHeader
    >
      <div className="flex flex-col items-center gap-y-4 py-8 px-4">
        {icon}
        <p className="text-sm text-dark text-center">{message}</p>
        <div className="flex gap-x-3 w-full mt-2">
          <Button
            variant={ButtonVariant.TERTIARY}
            onClick={onClose}
            disabled={isConfirming}
          >
            {cancelLabel}
          </Button>
          <Button onClick={onConfirm} spinner={isConfirming}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
