import { START_MAPPING_PAGE_CONTENT } from "@/constants";
import { PredictedFeatureStatus } from "@/enums/start-mapping";
import { TModelPredictionFeature } from "@/types";

export const ModelPredictionsTracker = ({
  features,
  resetModelPredictions,
}: {
  features: TModelPredictionFeature[];
  resetModelPredictions: (features: TModelPredictionFeature[]) => void;
}) => {
  const accepted = features.filter(
    (f) => f.properties.status === PredictedFeatureStatus.ACCEPTED,
  );
  const rejected = features.filter(
    (f) => f.properties.status === PredictedFeatureStatus.REJECTED,
  );

  return (
    <div className="flex items-center gap-x-2">
      <p className="text-dark text-body-4 font-medium text-nowrap">
        {START_MAPPING_PAGE_CONTENT.mapData.accepted}: {accepted.length}{" "}
        {START_MAPPING_PAGE_CONTENT.mapData.rejected}: {rejected.length}{" "}
      </p>
      {features.length > 0 ? (
        <button
          className="text-body-4 px-3 py-0.5 md:py-1 bg-grey text-white rounded-md"
          onClick={() => resetModelPredictions([])}
        >
          Clear
        </button>
      ) : null}
    </div>
  );
};
