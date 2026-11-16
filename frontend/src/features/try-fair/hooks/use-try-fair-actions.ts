import { useAuth } from "@/app/providers/auth-provider";
import { HANKO_URL } from "@/config";
import { getDownloadData } from "@/features/try-fair/components/start-mapping/export-map-results";
import { useTryFairParams } from "@/features/try-fair/hooks/use-try-fair-params";
import { useStartMappingStore } from "@/features/try-fair/utils/start-mapping-store";
import { geoJSONDowloader } from "@/utils";

/**
 * The try fAIr page actions: map a large area, change imagery, download,
 * share and prediction history. Shared by the desktop header buttons and
 * the mobile "Menu" on the map so both behave the same.
 */
export const useTryFairActions = () => {
  const { setChooseLocation } = useTryFairParams();
  const { isAuthenticated } = useAuth();
  const {
    setDownloadType,
    setShowShareModal,
    showPredictionHistory,
    setShowPredictionHistory,
    predictions,
    outputType,
    predictionBBox,
    predictionGridZoom,
  } = useStartMappingStore();

  const hasPredictions = Boolean(predictions?.features?.length);

  const downloadResults = () => {
    if (!predictions) return;
    geoJSONDowloader(
      getDownloadData(
        predictions,
        outputType,
        predictionBBox,
        predictionGridZoom,
      ),
      `fair-predictions-${outputType.toLowerCase()}`,
    );
  };

  /** Mapping a large area needs an account, so signed-out users log in first. */
  const mapLargeArea = () => {
    if (!isAuthenticated) {
      window.location.href = `${HANKO_URL}/app?return_to=${encodeURIComponent(window.location.href)}`;
      return;
    }
    setDownloadType("large-area");
  };

  return {
    isAuthenticated,
    hasPredictions,
    showPredictionHistory,
    downloadResults,
    mapLargeArea,
    changeImagery: () => setChooseLocation(true),
    share: () => setShowShareModal(true),
    togglePredictionHistory: () =>
      setShowPredictionHistory(!showPredictionHistory),
  };
};
