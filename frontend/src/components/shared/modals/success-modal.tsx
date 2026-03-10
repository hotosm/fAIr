import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { SHOELACE_SIZES } from "@/enums";

type SuccessModalProps = {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  icon: React.ReactNode;
  closeLabel?: string;
};

export const SuccessModal = ({
  isOpen,
  onClose,
  message,
  icon,
  closeLabel = "Done",
}: SuccessModalProps) => {
  if (!isOpen) return null;

  return (
    <Dialog isOpened={isOpen} closeDialog={onClose} noHeader>
      <div className="flex flex-col items-center gap-y-4 py-6 px-4">
        {icon}
        <p className="text-body-2 font-semibold text-center">{message}</p>
        <Button onClick={onClose} className="mt-2">
          {closeLabel}
        </Button>
      </div>
    </Dialog>
  );
};
