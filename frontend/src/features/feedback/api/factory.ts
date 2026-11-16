import { queryOptions } from "@tanstack/react-query";
import { getFeedbackRecords } from "@/features/feedback/api/feedback";
import type { BBOX } from "@/types";

export const FEEDBACK_RECORDS_QUERY_KEY = "feedback-records";

export const getFeedbackRecordsQueryOptions = (
  stacId: string,
  bbox: BBOX,
  userId: number,
) => {
  return queryOptions({
    queryKey: [FEEDBACK_RECORDS_QUERY_KEY, stacId, bbox, userId],
    queryFn: () => getFeedbackRecords({ stacId, bbox, userId }),
  });
};
