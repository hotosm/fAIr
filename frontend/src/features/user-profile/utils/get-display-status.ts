import { ModelTrainingStatus, PredictionRequestStatus } from "@/enums";

/**
 * Determines the display status of a prediction.
 *
 * When a prediction is finished AND published, the display status should
 * be "PUBLISHED" instead of the underlying API status. For all other cases
 * (for other statuses), return the API status as-is.
 */
export const getDisplayStatus = (
  status: ModelTrainingStatus | PredictionRequestStatus,
  published?: boolean,
): string => {
  if (
    status === ModelTrainingStatus.FINISHED ||
    (status === PredictionRequestStatus.COMPLETED && published)
  ) {
    return "PUBLISHED";
  }
  return status;
};
