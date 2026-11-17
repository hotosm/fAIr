export enum FeedbackRating {
  VERY_GOOD = "very_good",
  GOOD = "good",
  BAD = "bad",
}

export type FeedbackFormValues = {
  rating: FeedbackRating;
  comment: string;
};

export enum FeatureVerdict {
  VALID = "valid",
  INVALID = "invalid",
}

/** Verdicts keyed by the feature's index in the predictions collection. */
export type FeatureVerdicts = Record<number, FeatureVerdict>;

/** Backend `FeedbackAction` values (shared/enums.py). */
export enum FeedbackAction {
  ACCEPT = "accept",
  REJECT = "reject",
}
