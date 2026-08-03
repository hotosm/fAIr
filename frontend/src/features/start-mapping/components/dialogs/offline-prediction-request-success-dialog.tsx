import { ModelFormConfirmation } from "@/assets/images";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Image } from "@/components/ui/image";
import { APPLICATION_ROUTES } from "@/constants";
import { ButtonVariant } from "@/enums/common";
import { useNavigate } from "react-router-dom";

export const OfflinePredictionRequestSuccess = ({
  isOpen,
  onClose,
  continueLabel = "Done",
}: {
  isOpen: boolean;
  onClose: () => void;
  /** Label for the action that closes the confirmation and keeps the user mapping. */
  continueLabel?: string;
}) => {
  const navigate = useNavigate();

  return (
    <Dialog isOpened={isOpen} closeDialog={onClose}>
      <div className="flex flex-col items-center gap-y-4 h-full  w-full justify-center">
        <div className="bg-secondary p-2 rounded-full flex items-center justify-center">
          <Image src={ModelFormConfirmation} alt="Success Icon" />
        </div>
        <h1 className="text-title-3 font-semibold">Prediction Request Sent</h1>
        <p className="text-body-3 text-center">
          We have received the request to run prediction on your specified area.
          You will be notified when the prediction is done.
        </p>
        <div className="flex flex-col md:flex-row gap-y-3 md:gap-0 justify-between w-full">
          <Button
            variant={ButtonVariant.DARK}
            onClick={() => {
              navigate(APPLICATION_ROUTES.PROFILE_OFFLINE_PREDICTIONS);
            }}
            className="md:!w-fit"
          >
            View requests
          </Button>
          <Button
            onClick={onClose}
            variant={ButtonVariant.PRIMARY}
            className="md:!w-fit"
          >
            {continueLabel}
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
