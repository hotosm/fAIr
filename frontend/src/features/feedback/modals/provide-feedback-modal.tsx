import { useEffect, useId, useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { CloseIcon } from "@/components/ui/icons";
import { Spinner } from "@/components/ui/spinner";
import { SHOELACE_SIZES } from "@/enums";
import { FeedbackRatingOptions } from "@/features/feedback/components/feedback-rating-options";
import {
  FEEDBACK_COMMENT_MAX_LENGTH,
  FEEDBACK_CONTENT,
} from "@/features/feedback/constants";
import type {
  FeedbackFormValues,
  FeedbackRating,
} from "@/features/feedback/types";

type ProvideFeedbackModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: FeedbackFormValues) => void;
  isSubmitting?: boolean;
};

export const ProvideFeedbackModal = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
}: ProvideFeedbackModalProps) => {
  const { modal } = FEEDBACK_CONTENT;
  const [rating, setRating] = useState<FeedbackRating | null>(null);
  const [comment, setComment] = useState("");
  const ratingGroupName = useId();
  const commentId = useId();

  // Start each opening with a blank form.
  useEffect(() => {
    if (isOpen) {
      setRating(null);
      setComment("");
    }
  }, [isOpen]);

  const canSubmit = rating !== null && !isSubmitting;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!rating || isSubmitting) return;
    onSubmit({ rating, comment: comment.trim() });
  };

  return (
    <Dialog
      isOpened={isOpen}
      closeDialog={onClose}
      noHeader
      noPadding
      size={SHOELACE_SIZES.MEDIUM_LARGE}
      preventClose={isSubmitting}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-6 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-base font-semibold text-dark">{modal.title}</h2>
            <p className="text-sm text-grey">{modal.description}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close"
            className="p-1 -mr-1 rounded-md text-dark hover:bg-black/5 disabled:cursor-not-allowed"
          >
            <CloseIcon className="size-5" />
          </button>
        </div>

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-3 text-sm font-medium text-dark">
            {modal.ratingQuestion}
          </legend>
          <FeedbackRatingOptions
            name={ratingGroupName}
            value={rating}
            onChange={setRating}
            disabled={isSubmitting}
          />
        </fieldset>

        <div className="flex flex-col gap-3">
          <label htmlFor={commentId} className="text-sm font-medium text-dark">
            {modal.commentLabel}
          </label>
          <textarea
            id={commentId}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={modal.commentPlaceholder}
            maxLength={FEEDBACK_COMMENT_MAX_LENGTH}
            disabled={isSubmitting}
            rows={6}
            className="w-full resize-none rounded-lg border border-gray-border p-4 text-sm text-dark placeholder:text-gray-disabled outline-none focus:border-dark disabled:bg-gray-white"
          />
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="min-w-28 rounded-lg bg-off-white px-6 py-2.5 text-sm text-dark hover:bg-[#E5E4E4] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {modal.cancel}
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className="flex min-w-36 items-center justify-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm text-white hover:bg-[#dd5f60] disabled:cursor-not-allowed disabled:bg-[#E3E5E8] disabled:text-white"
          >
            {modal.submit}
            {isSubmitting && <Spinner />}
          </button>
        </div>
      </form>
    </Dialog>
  );
};
