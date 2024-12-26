import { startMappingPageContent } from "@/constants";
import { TModelPredictions } from "@/types";

export const ModelPredictionsTracker = ({
  modelPredictions,
  clearPredictions,
}: {
  modelPredictions: TModelPredictions;
  clearPredictions: () => void;
}) => {
  return (
    <div className="flex items-center gap-x-2">
      <p className="text-dark text-body-3 font-medium text-nowrap">
        {startMappingPageContent.mapData.accepted}:{" "}
        {modelPredictions.accepted.length}{" "}
        {startMappingPageContent.mapData.rejected}:{" "}
        {modelPredictions.rejected.length}{" "}
      </p>
      {modelPredictions.accepted.length > 0 ||
      modelPredictions.rejected.length > 0 ||
      modelPredictions.all.length > 0 ? (
        <button
          className="text-body-3 px-3 py-0.5 md:py-1 bg-gray text-white rounded-md"
          onClick={clearPredictions}
        >
          Clear
        </button>
      ) : null}
    </div>
  );
};
