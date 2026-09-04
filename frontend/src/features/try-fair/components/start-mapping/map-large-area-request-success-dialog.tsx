import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { SuccessCheckIcon } from "@/components/ui/icons/success-check-icon";
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
    <Dialog noPadding isOpened={isOpen} size={SHOELACE_SIZES.SMALL} closeDialog={onClose}>
      <div className="flex flex-col items-center pb-4 gap-y-8 justify-between">
        <div className="flex justify-center items-center flex-col gap-2">
          <div>
            <SuccessCheckIcon />
          </div>
          <h1 className="text-base font-medium">Mapping Requested!</h1>
        </div>

        <div className="flex flex-row items-center w-full md:w-fit md:flex-row gap-4 md:gap-4 justify-between ">
          <Button
            variant={ButtonVariant.TERTIARY}
            onClick={() => navigate(APPLICATION_ROUTES.PROFILE_OFFLINE_PREDICTIONS)}
            className="md:!w-36"
            size="medium"
            fontSize={"12px"}
            rounded
          >
            Go to Requests
          </Button>
          <Button
            onClick={onClose}
            rounded
            size="medium"
            fontSize={"12px"}
            variant={ButtonVariant.PRIMARY}
            className=" md:!w-36"
          >
            Done
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
