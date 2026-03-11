import { ConfirmationModal, SuccessModal } from "@/components/shared/modals";
import { WarningIcon } from "@/components/ui/icons/warning-icon";
import { WavyCheckIcon } from "@/components/ui/icons/wavy-check-icon";
import { usePublishPrediction } from "@/features/user-profile/api/predictions";
import { showErrorToast } from "@/utils";
import { useState } from "react";

type ModalStep = "confirming" | "success";

type PublishAction = "publish" | "unpublish";

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
  const [step, setStep] = useState<ModalStep>("confirming");
  /*
  stored the action locally because `isPublished` from props may still contain
  the previous value when the success modal renders after the mutation. This
  prevents the UI from briefly showing the wrong success message.
*/
  const [action, setAction] = useState<PublishAction | null>(null);

  const { mutate, isPending } = usePublishPrediction({
    mutationConfig: {
      onSuccess: () => setStep("success"),
      onError: (err) => {
        onClose();
        showErrorToast(err);
      },
    },
  });

  const handleClose = () => {
    setStep("confirming");
    setAction(null);
    onClose();
  };

  const handleConfirm = () => {
    const nextAction: PublishAction = isPublished ? "unpublish" : "publish";
    setAction(nextAction);
    mutate({
      predictionId,
      published: !isPublished,
    });
  };

  if (!isOpen) return null;
  if (step === "success") {
    return (
      <SuccessModal
        isOpen
        onClose={handleClose}
        message={
          action === "unpublish"
            ? "Prediction Unpublished!"
            : "Prediction Published!"
        }
        icon={
          <div className="bg-green-secondary p-3 rounded-full">
            <WavyCheckIcon />
          </div>
        }
      />
    );
  }

  return (
    <ConfirmationModal
      isOpen
      onClose={handleClose}
      onConfirm={handleConfirm}
      
      isConfirming={isPending}
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
