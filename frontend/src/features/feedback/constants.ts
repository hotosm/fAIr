import { FeedbackRating } from "@/features/feedback/types";

export const FEEDBACK_CONTENT = {
  results: {
    title: "Results",
    provideFeedback: "Provide Feedback",
    detected: (count: number) =>
      `${count} ${count === 1 ? "feature" : "features"} detected`,
    valid: (count: number) =>
      count > 0
        ? `${count} ${count === 1 ? "feature" : "features"} marked as Valid`
        : "No feature marked as Valid",
    invalid: (count: number) =>
      count > 0
        ? `${count} ${count === 1 ? "feature" : "features"} marked as Invalid`
        : "No feature marked as Invalid",
    downloadLabel: (label: string) => `Download ${label.toLowerCase()}`,
  },
  modal: {
    title: "Provide Feedback",
    description:
      "Your feedback will help to improve the model used for AI detection",
    ratingQuestion: "How well are the features detected?",
    commentLabel: "Add any additional comment",
    commentPlaceholder: "Enter comment",
    cancel: "Cancel",
    submit: "Send Feedback",
  },
  success: {
    title: "Feedback Sent!",
    confirm: "Okay",
  },
} as const;

export const FEEDBACK_RATING_OPTIONS: {
  value: FeedbackRating;
  label: string;
}[] = [
  {
    value: FeedbackRating.VERY_GOOD,
    label: "Very good, most features are well detected",
  },
  { value: FeedbackRating.GOOD, label: "Good, Some features are wrong" },
  { value: FeedbackRating.BAD, label: "Bad, most features are wrong" },
];

export const FEEDBACK_COMMENT_MAX_LENGTH = 1000;
