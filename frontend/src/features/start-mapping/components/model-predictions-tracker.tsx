import { startMappingPageContent } from "@/constants";
import { TModelPredictions } from "@/types";

export const ModelPredictionsTracker = ({
  modelPredictions,
}: {
  modelPredictions: TModelPredictions;
}) => {
  return (
    <p className="text-dark text-body-3 font-medium text-nowrap">
      {startMappingPageContent.mapData.accepted}:{" "}
      {modelPredictions.accepted.length}{" "}
      {startMappingPageContent.mapData.rejected}:{" "}
      {modelPredictions.rejected.length}{" "}
    </p>
  );
};
