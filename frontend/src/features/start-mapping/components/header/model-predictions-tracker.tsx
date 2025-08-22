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
    (f) => f.properties.status === PredictedFeatureStatus.ACCEPTED
  );
  const rejected = features.filter(
    (f) => f.properties.status === PredictedFeatureStatus.REJECTED
  );

  return (
    <div className="flex items-center gap-x-2">
      <p className="text-nowrap text-body-4 font-medium text-dark">
        {START_MAPPING_PAGE_CONTENT.mapData.accepted}: {accepted.length}{" "}
        {START_MAPPING_PAGE_CONTENT.mapData.rejected}: {rejected.length}{" "}
      </p>
      {features.length > 0 ? (
        <button
          className="rounded-md bg-grey px-3 py-0.5 text-body-4 text-white md:py-1"
          onClick={() => resetModelPredictions([])}
        >
          Clear
        </button>
      ) : null}
    </div>
  );
};
