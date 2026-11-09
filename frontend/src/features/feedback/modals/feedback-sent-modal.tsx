import { Dialog } from "@/components/ui/dialog";
import { WavyCheckIcon } from "@/components/ui/icons/wavy-check-icon";
import { SHOELACE_SIZES } from "@/enums";
import { FEEDBACK_CONTENT } from "@/features/feedback/constants";

type FeedbackSentModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const FeedbackSentModal = ({
  isOpen,
  onClose,
}: FeedbackSentModalProps) => (
  <Dialog
    isOpened={isOpen}
    closeDialog={onClose}
    noHeader
    noPadding
    size={SHOELACE_SIZES.SMALL}
  >
    <div className="flex flex-col items-center gap-8 px-5 py-8">
      <div className="flex flex-col items-center gap-5">
        <div className="flex size-16 items-center justify-center rounded-full bg-[#DCFCE7]">
          <WavyCheckIcon className="size-7" />
        </div>
        <h2 className="text-lg font-semibold text-dark">
          {FEEDBACK_CONTENT.success.title}
        </h2>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="w-full max-w-[220px] rounded-lg bg-primary px-6 py-3 text-sm text-white hover:bg-[#dd5f60]"
      >
        {FEEDBACK_CONTENT.success.confirm}
      </button>
    </div>
  </Dialog>
);
