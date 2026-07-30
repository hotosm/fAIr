import { ModelFormConfirmation } from "@/assets/images";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Image } from "@/components/ui/image";
import { APPLICATION_ROUTES } from "@/constants";
import { ButtonVariant, SHOELACE_SIZES } from "@/enums";
import { useNavigate } from "react-router-dom";

/** Confirmation shown after a Try fAIr Map Large Area request is submitted. */
export const MapLargeAreaRequestSuccess = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const navigate = useNavigate();

  return (
    <Dialog isOpened={isOpen} size={SHOELACE_SIZES.SMALL} closeDialog={onClose}>
      <div className="flex flex-col items-center gap-y-4 h-full w-full justify-center">
        <div className="bg-secondary p-2 rounded-full flex items-center justify-center">
          <Image src={ModelFormConfirmation} alt="Success Icon" />
        </div>
        <h1 className="text-title-3 font-semibold">Map Area Request Sent</h1>
        <p className="text-body-3 text-center">
          We have received your request to map the selected area. You will be
          notified when the prediction is ready.
        </p>
        <div className="flex flex-col items-center w-full md:w-fit md:flex-row gap-4 md:gap-4 justify-between ">
          <Button
            variant={ButtonVariant.DARK}
            onClick={() => navigate(APPLICATION_ROUTES.PROFILE_OFFLINE_PREDICTIONS)}
            className="md:!w-fit"
            size="medium"

            rounded
          >
            View requests
          </Button>
          <Button
            onClick={onClose}
            rounded
            size="medium"
            variant={ButtonVariant.PRIMARY}
            className="md:!w-fit"
          >
            Continue mapping
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
