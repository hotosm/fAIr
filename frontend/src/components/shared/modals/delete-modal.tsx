import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { DeleteIcon } from "@/components/ui/icons";
import { ButtonVariant } from "@/enums/common";

export const DeleteModal = ({
  isOpen,
  onClose,
  onDelete,
  messageSuffix,
  title,
  isDeleting,
}: {
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => void;
  messageSuffix: string;
  title: string;
  isDeleting: boolean;
}) => {
  if (!isOpen) return null;

  return (
    <Dialog isOpened={isOpen} closeDialog={onClose} preventClose={isDeleting}>
      <div className="flex size-full flex-col items-center justify-center  gap-y-4">
        <div className="flex items-center justify-center rounded-full bg-secondary p-2">
          <DeleteIcon className="icon-lg text-primary" />
        </div>
        <h1 className="text-title-3 font-semibold">{title}</h1>
        <p className="text-center text-body-3">
          Are you sure you want to delete {messageSuffix}?
        </p>
        <div className="flex w-full flex-col justify-between gap-y-3 md:flex-row md:gap-0">
          <Button
            disabled={isDeleting}
            onClick={onDelete}
            className="md:!w-fit"
          >
            Delete
          </Button>
          <Button
            onClick={onClose}
            variant={ButtonVariant.TERTIARY}
            className="md:!w-fit"
          >
            Cancel
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
