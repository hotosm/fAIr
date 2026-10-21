import type {
  MappingSnapshot,
  PredictionHistoryEntry,
  SavedUserState,
} from "@/features/try-fair/api/user-state";

/** Oldest first, so viewing an entry never changes its eviction order. */
export function appendPrediction(
  history: PredictionHistoryEntry[],
  entry: PredictionHistoryEntry,
  limit: number,
): PredictionHistoryEntry[] {
  return [...history, entry].slice(-limit);
}

export function getSavedPrediction(project: SavedUserState | undefined) {
  const state = project?.state;
  if (state?.active_prediction_id !== undefined) {
    return (
      state.prediction_history?.find(
        (entry) => entry.id === state.active_prediction_id,
      )?.snapshot.prediction_result ?? null
    );
  }
  return state?.prediction_result ?? null;
}

/** Confidence has its own control; keeping it in overrides would lock that slider. */
export function getHistoryUrlParams(
  urlParams: MappingSnapshot["url_params"],
  { confidence_threshold, ...overrides }: MappingSnapshot["params"],
): MappingSnapshot["url_params"] {
  return {
    ...urlParams,
    confidence:
      typeof confidence_threshold === "number"
        ? confidence_threshold
        : urlParams.confidence,
    params: overrides,
    chooseLocation: false,
  };
}

export function limitProjectHistory(
  project: SavedUserState,
  limit: number,
): SavedUserState {
  const history = project.state.prediction_history;
  if (!history || history.length <= limit) return project;
  const retained = history.slice(-limit);
  const activeId = project.state.active_prediction_id;
  const activeWasRemoved =
    activeId && !retained.some((entry) => entry.id === activeId);
  const latest = retained[retained.length - 1];
  return {
    ...project,
    state: {
      ...(activeWasRemoved ? latest.snapshot : project.state),
      prediction_result: undefined,
      prediction_history: retained,
      active_prediction_id: activeWasRemoved ? latest.id : activeId,
    },
  };
}

export function restorePredictionHistory(
  project: SavedUserState | undefined,
  limit: number,
): PredictionHistoryEntry[] {
  if (!project) return [];
  const state = project.state;
  if (state.prediction_history) return state.prediction_history.slice(-limit);
  if (!state.prediction_result || !state.url_params) return [];
  return [
    {
      id: `legacy-${project.pid}`,
      created_at: project.timestamp,
      snapshot: {
        type: "mapping",
        name: state.name,
        category: state.category ?? state.url_params.feature,
        model: state.model,
        imagery: state.imagery,
        bbox: state.prediction_result.bbox,
        zoom: state.prediction_result.gridZoom,
        params: state.prediction_result.params,
        url_params: state.url_params,
        prediction_result: state.prediction_result,
      },
    },
  ];
}
