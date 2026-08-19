import { ConfirmationModal } from "@/components/shared/modals";
import { WarningIcon } from "@/components/ui/icons/warning-icon";
import { usePublishPrediction } from "@/features/user-profile/api/predictions";
import { showErrorToast, showSuccessToast } from "@/utils";

type PublishPredictionFlowProps = {
  predictionId: number;
  isPublished: boolean;
  isOpen: boolean;
  onClose: () => void;
};

export const PublishPredictionFlow = ({
  predictionId,
  isPublished,
  isOpen,
  onClose,
}: PublishPredictionFlowProps) => {
  const { mutate, isPending } = usePublishPrediction({
    mutationConfig: {
      onSuccess: () => {
        showSuccessToast(
          isPublished
            ? "Prediction retracted successfully."
            : "Prediction published successfully.",
        );
        onClose();
      },
      onError: (err) => {
        onClose();
        showErrorToast(err);
      },
    },
  });

  const handleClose = () => {
    onClose();
  };

  const handleConfirm = () => {
    mutate({
      predictionId,
      published: !isPublished,
    });
  };

  if (!isOpen) return null;

  return (
    <ConfirmationModal
      isOpen
      onClose={handleClose}
      onConfirm={handleConfirm}
      isConfirming={isPending}
      rounded
      message={
        isPublished
          ? "Confirm you want to Retract this prediction from public view"
          : "Confirm you want to make this prediction public"
      }
      icon={
        <div className="bg-secondary-yellow p-3.5 rounded-full">
          <WarningIcon className="size-5" />
        </div>
      }
    />
  );
};
