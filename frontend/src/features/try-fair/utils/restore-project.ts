import { ModelType } from "@/enums";
import type { SavedUserState } from "@/features/try-fair/api/user-state";
import { TRY_FAIR_PARAM_DEFAULTS } from "@/features/try-fair/hooks/use-try-fair-params";
import { TRY_FAIR_RESOLUTION_ZOOM } from "./common";
import { getTileServerTypeFromURL } from "@/utils/regex-utils";

/** Older saved activities lack url_params; restore their model and imagery too. */
export const getProjectSearchParams = ({ state }: SavedUserState) => {
  const resolution = Object.entries(TRY_FAIR_RESOLUTION_ZOOM)
    .find(([, zoom]) => zoom === state.zoom)?.[0];
  const values = {
    ...TRY_FAIR_PARAM_DEFAULTS,
    model: state.model.id,
    selectedModelId: state.model.id,
    feature: state.category ?? TRY_FAIR_PARAM_DEFAULTS.feature,
    mode: ModelType.IMAGERY,
    resolution: resolution ?? TRY_FAIR_PARAM_DEFAULTS.resolution,
    confidence: typeof state.params?.confidence_threshold === "number"
      ? state.params.confidence_threshold
      : TRY_FAIR_PARAM_DEFAULTS.confidence,
    imagery: state.imagery.url,
    imageryType: getTileServerTypeFromURL(state.imagery.url),
    oamItem: null,
    chooseLocation: false,
    ...state.url_params,
  };
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value !== null) search.set(key, String(value));
  }
  return search;
};
