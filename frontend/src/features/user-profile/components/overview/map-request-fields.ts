import { PredictionRequestStatus } from "@/enums";
import { APPLICATION_ROUTES } from "@/constants/routes";
import type { TOfflinePrediction } from "@/types";

// Single source of truth for how a map request is shown, shared by the
// desktop table and the mobile cards.

export const getModelUsed = (p: TOfflinePrediction): string =>
  p.model_name || p.local_model_stac_id || "-";

export const getPredictionName = (p: TOfflinePrediction): string =>
  p.description || `Prediction #${p.id}`;

export const isResultReady = (p: TOfflinePrediction): boolean =>
  p.results_ready ||
  p.status?.toLowerCase() === PredictionRequestStatus.COMPLETED;

export const isPublished = (p: TOfflinePrediction): boolean =>
  p.visibility === "public" || Boolean(p.published);

export const getResultPath = (p: TOfflinePrediction): string =>
  APPLICATION_ROUTES.MAP_REQUEST_RESULT.replace(":id", String(p.id));
