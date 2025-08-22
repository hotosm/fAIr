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
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const navigate = useNavigate();

  return (
    <Dialog isOpened={isOpen} closeDialog={onClose}>
      <div className="flex size-full flex-col items-center justify-center  gap-y-4">
        <div className="flex items-center justify-center rounded-full bg-secondary p-2">
          <Image src={ModelFormConfirmation} alt="Success Icon" />
        </div>
        <h1 className="text-title-3 font-semibold">Prediction Request Sent</h1>
        <p className="text-center text-body-3">
          We have received the request to run prediction on your specified area.
          You will be notified when the prediction is done.
        </p>
        <div className="flex w-full flex-col justify-between gap-y-3 md:flex-row md:gap-0">
          <Button
            variant={ButtonVariant.DARK}
            onClick={() => {
              navigate(APPLICATION_ROUTES.PROFILE_OFFLINE_PREDICTIONS);
            }}
            className="md:!w-fit"
          >
            See requests
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
