import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  FEEDBACK_RECORDS_QUERY_KEY,
  getFeedbackRecordsQueryOptions,
} from "@/features/feedback/api/factory";
import type { FeedbackConfig } from "@/features/feedback/api/feedback";
import {
  useCreateFeatureFeedback,
  useDeleteFeatureFeedback,
  useUpdateFeatureFeedback,
} from "@/features/feedback/hooks/use-feedback-api";
import {
  FeatureVerdict,
  FeedbackAction,
  type FeatureVerdicts,
} from "@/features/feedback/types";
import {
  collectFeaturesByVerdict,
  matchRecordsToFeatures,
} from "@/features/feedback/utils/feature-feedback";
import type { BBOX } from "@/types";
import { showErrorToast } from "@/utils";

/** The prediction run the marks belong to. */
export type FeatureFeedbackContext = {
  stacId: string;
  bbox: BBOX;
  userId: number;
  config?: FeedbackConfig;
};

const VERDICT_TO_ACTION = {
  [FeatureVerdict.VALID]: FeedbackAction.ACCEPT,
  [FeatureVerdict.INVALID]: FeedbackAction.REJECT,
};

const ACTION_TO_VERDICT = {
  [FeedbackAction.ACCEPT]: FeatureVerdict.VALID,
  [FeedbackAction.REJECT]: FeatureVerdict.INVALID,
};

/**
 * 👍/👎 marks on predicted features.
 *
 * The backend is the source of truth: the user's saved feedback for this
 * run is fetched and matched to the predicted features by geometry. That
 * gives each feature its colour and the saved record to update or delete.
 *
 * A click saves straight away (create, change or delete the record), then
 * refetches the saved list. While that happens, `saving` shows the new mark
 * so the map responds immediately. One save runs at a time.
 */
export const useFeatureFeedback = (
  predictions: GeoJSON.FeatureCollection | null,
  context: FeatureFeedbackContext | null,
) => {
  const queryClient = useQueryClient();
  const { mutateAsync: createFeedback } = useCreateFeatureFeedback();
  const { mutateAsync: updateFeedback } = useUpdateFeatureFeedback();
  const { mutateAsync: deleteFeedback } = useDeleteFeatureFeedback();

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [saving, setSaving] = useState<{
    id: number;
    verdict: FeatureVerdict | undefined;
  } | null>(null);

  // A new prediction run starts with nothing selected.
  useEffect(() => {
    setSelectedId(null);
    setSaving(null);
  }, [predictions]);

  // 1. The user's saved feedback for this run.
  const { data: records = [] } = useQuery({
    ...getFeedbackRecordsQueryOptions(
      context?.stacId ?? "",
      context?.bbox ?? [0, 0, 0, 0],
      context?.userId ?? 0,
    ),
    enabled: context !== null,
  });

  // 2. Which predicted feature each saved record belongs to.
  const recordByFeature = useMemo(
    () => matchRecordsToFeatures(predictions, records),
    [predictions, records],
  );

  // 3. The marks to draw: saved ones, plus the one being saved right now.
  const verdicts = useMemo<FeatureVerdicts>(() => {
    const next: FeatureVerdicts = {};
    recordByFeature.forEach((record, id) => {
      next[id] = ACTION_TO_VERDICT[record.properties.action];
    });
    if (saving?.verdict) next[saving.id] = saving.verdict;
    else if (saving) delete next[saving.id];
    return next;
  }, [recordByFeature, saving]);

  /** 👍/👎 on a feature. Choosing the active one again clears it. */
  const toggleVerdict = async (id: number, verdict: FeatureVerdict) => {
    const geometry = predictions?.features[id]?.geometry;
    if (!context || !geometry || saving) return;

    const next = verdicts[id] === verdict ? undefined : verdict;
    const recordId = recordByFeature.get(id)?.properties.id;
    setSaving({ id, verdict: next });

    try {
      if (!next) {
        if (recordId !== undefined) await deleteFeedback({ id: recordId });
      } else if (recordId !== undefined) {
        await updateFeedback({ id: recordId, action: VERDICT_TO_ACTION[next] });
      } else {
        await createFeedback({
          stacId: context.stacId,
          geometry,
          action: VERDICT_TO_ACTION[next],
          config: context.config,
        });
      }
      // Wait for the refreshed list so the mark doesn't flicker back.
      await queryClient.invalidateQueries({
        queryKey: [FEEDBACK_RECORDS_QUERY_KEY],
      });
    } catch (error) {
      showErrorToast(error);
    } finally {
      setSaving(null);
    }
  };

  const validFeatures = useMemo(
    () => collectFeaturesByVerdict(predictions, verdicts, FeatureVerdict.VALID),
    [predictions, verdicts],
  );
  const invalidFeatures = useMemo(
    () =>
      collectFeaturesByVerdict(predictions, verdicts, FeatureVerdict.INVALID),
    [predictions, verdicts],
  );

  return {
    verdicts,
    selectedId,
    select: setSelectedId,
    toggleVerdict,
    isSaving: saving !== null,
    validFeatures,
    invalidFeatures,
  };
};

export type FeatureFeedbackState = ReturnType<typeof useFeatureFeedback>;
