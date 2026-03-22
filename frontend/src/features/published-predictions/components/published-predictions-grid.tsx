import { Button } from "@/components/ui/button";
import { NoTrainingAreaIcon } from "@/components/ui/icons";
import { TOfflinePrediction } from "@/types";
import { PublishedPredictionCard } from "./published-prediction-card";

type PublishedPredictionsGridProps = {
  data: TOfflinePrediction[];
  isPending: boolean;
  isError: boolean;
  refetch: () => void;
  onViewResults: (prediction: TOfflinePrediction) => void;
  onViewDetails: (prediction: TOfflinePrediction) => void;
  isMapView?: boolean;
};

const GridSkeleton = ({isMapview }: {isMapview?: boolean}) => (
  <div className={isMapview ? "grid grid-cols-1 sm:grid-cols-2 gap-6" : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"}>
    {Array.from({ length: 12 }).map((_, index) => (
      <div
        key={index}
        className="w-full h-48 bg-light-gray rounded-lg animate-pulse"
      />
    ))}
  </div>
);

export const PublishedPredictionsGrid = ({
  data,
  isPending,
  isError,
  refetch,
  onViewResults,
  onViewDetails,
  isMapView
}: PublishedPredictionsGridProps) => {
  if (isPending) {
    return <GridSkeleton isMapview={isMapView} />;
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center w-full py-20 gap-y-4">
        <p className="text-grey text-body-2base">
          Error loading published predictions.
        </p>
        <Button className="!w-fit" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col gap-y-4 items-center justify-center py-20">
        <NoTrainingAreaIcon />
        <p className="text-grey text-body-2base">
          No published predictions found.
        </p>
      </div>
    );
  }

  return (
    <div className={
      isMapView ?
      "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6"
      :
      "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
    }>
      {data.map((prediction) => (
        <PublishedPredictionCard
          key={prediction.id}
          prediction={prediction}         
          onViewResults={onViewResults}
          onViewDetails={onViewDetails}
        />
      ))}
    </div>
  );
};
