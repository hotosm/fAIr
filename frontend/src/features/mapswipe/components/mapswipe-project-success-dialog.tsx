import { ModelFormConfirmation } from "@/assets/images";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Image } from "@/components/ui/image";

import { ButtonVariant } from "@/enums/common";

export const MapswipeProjectCreationuccess = ({
  isOpen,
  onClose,
  handleMapswipeProjectOpen,
}: {
  isOpen: boolean;
  onClose: () => void;
  handleMapswipeProjectOpen: () => void;
}) => {
  return (
    <Dialog isOpened={isOpen} closeDialog={onClose}>
      <div className="flex flex-col items-center gap-y-4 h-full  w-full justify-center">
        <div className="bg-secondary p-2 rounded-full flex items-center justify-center">
          <Image src={ModelFormConfirmation} alt="Success Icon" />
        </div>
        <h1 className="text-title-3 font-semibold">MapSwipe Project Created</h1>
        <p className="text-body-3 text-center">
          Your MapSwipe project has been successfully created. You can now start
          mapping tasks and contribute to the project.
        </p>
        <div className="flex flex-col md:flex-row gap-y-3 md:gap-0 justify-between w-full">
          <Button
            variant={ButtonVariant.TERTIARY}
            onClick={handleMapswipeProjectOpen}
            className="md:!w-fit"
          >
            Open
          </Button>
          <Button
            onClick={onClose}
            variant={ButtonVariant.PRIMARY}
            className="md:!w-fit"
          >
            Done
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
