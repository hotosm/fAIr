import { FeedbackAction } from "@/features/feedback/types";
import { API_ENDPOINTS, apiClient } from "@/services";
import type { BBOX } from "@/types";

/** Run settings stored alongside each feedback record. */
export type FeedbackConfig = Record<string, number | string | boolean | null>;

export type FeedbackRecordProperties = {
  id: number;
  stac_id: string;
  action: FeedbackAction;
  comments: string;
  config: FeedbackConfig;
  user?: { osm_id: number; username: string };
  created_at: string;
};

/**
 * A feedback record as returned by the API. The backend serializer is a
 * GeoFeatureModelSerializer with `id_field = False`, so the record id lives
 * under `properties`.
 */
export type FeedbackRecord = {
  type: "Feature";
  geometry: GeoJSON.Geometry;
  properties: FeedbackRecordProperties;
};

/**
 * A page of records. GeoFeatureModelSerializer wraps list results in a
 * FeatureCollection; a plain array is accepted too.
 */
type FeedbackRecordsPage = {
  count: number;
  next: string | null;
  results:
    | { type: "FeatureCollection"; features: FeedbackRecord[] }
    | FeedbackRecord[];
};

export type TCreateFeatureFeedbackPayload = {
  stacId: string;
  geometry: GeoJSON.Geometry;
  action: FeedbackAction;
  comments?: string;
  config?: FeedbackConfig;
};

export const createFeatureFeedback = async ({
  stacId,
  geometry,
  action,
  comments = "",
  config = {},
}: TCreateFeatureFeedbackPayload): Promise<FeedbackRecord> => {
  const res = await apiClient.post<FeedbackRecord>(
    API_ENDPOINTS.CREATE_FEEDBACK,
    {
      type: "Feature",
      geometry,
      properties: { stac_id: stacId, action, comments, config },
    },
  );
  return res.data;
};

export type TUpdateFeatureFeedbackPayload = {
  id: number;
  action: FeedbackAction;
};

export const updateFeatureFeedback = async ({
  id,
  action,
}: TUpdateFeatureFeedbackPayload): Promise<FeedbackRecord> => {
  const res = await apiClient.patch<FeedbackRecord>(
    API_ENDPOINTS.UPDATE_FEEDBACK(id),
    { properties: { action } },
  );
  return res.data;
};

export type TDeleteFeatureFeedbackPayload = {
  id: number;
};

export const deleteFeatureFeedback = async ({
  id,
}: TDeleteFeatureFeedbackPayload): Promise<void> => {
  await apiClient.delete(API_ENDPOINTS.DELETE_FEEDBACK(id));
};

export type TFeedbackRecordsParams = {
  stacId: string;
  bbox: BBOX;
  userId: number;
};

/** Page size used when reading back a run's records. */
export const FEEDBACK_RECORDS_PAGE_SIZE = 500;

/**
 * Every feedback record the user saved for a model inside a bbox, newest
 * first. Follows the pagination until all pages are read.
 */
export const getFeedbackRecords = async ({
  stacId,
  bbox,
  userId,
}: TFeedbackRecordsParams): Promise<FeedbackRecord[]> => {
  const records: FeedbackRecord[] = [];
  let offset = 0;
  for (;;) {
    const res = await apiClient.get<FeedbackRecordsPage>(
      API_ENDPOINTS.GET_FEEDBACKS,
      {
        params: {
          stac_id: stacId,
          user: userId,
          in_bbox: bbox.join(","),
          limit: FEEDBACK_RECORDS_PAGE_SIZE,
          offset,
        },
      },
    );
    const { results, next } = res.data;
    const page = Array.isArray(results) ? results : results.features;
    records.push(...page);
    if (!next || page.length === 0) return records;
    offset += page.length;
  }
};
