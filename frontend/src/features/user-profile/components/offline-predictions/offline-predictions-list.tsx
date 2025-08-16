import { Button } from "@/components/ui/button";
import { NoTrainingAreaIcon } from "@/components/ui/icons";
import { TOfflinePrediction } from "@/types";
import { OfflinePredictionsListSkeleton } from "./offline-prediction-list-skeleton";
import { OfflinePredictionCard } from "./offline-prediction-card";

export const OfflinePredictionsList = ({
  data,
  isPending,
  isError,
  refetch,
  handleTrainingLogsModal,
  handlePredictionResultModal,
}: {
  data: TOfflinePrediction[];
  isPending: boolean;
  isError: boolean;
  refetch: () => void;
  handleTrainingLogsModal: (taskId: string) => void;
  handlePredictionResultModal: (prediction: TOfflinePrediction) => void;
}) => {
  /**
   * Pending state.
   */
  if (isPending) {
    return <OfflinePredictionsListSkeleton />;
  }

  /**
   * Error state.
   */
  if (isError) {
    return (
      <div className="flex size-full flex-col items-center justify-center gap-y-10">
        Error loading offline predictions.
        <Button className="!w-fit" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  /**
   * Empty state.
   */

  if (data.length === 0) {
    return (
      <div className="flex flex-col  items-center justify-center gap-y-10">
        <NoTrainingAreaIcon />
        <p>No offline predictions found.</p>
      </div>
    );
  }

  /**
   * Dataset list
   */
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-6 md:grid-cols-[repeat(auto-fill,minmax(299px,1fr))]">
      {data.map((data) => (
        <OfflinePredictionCard
          predictionResult={data}
          key={data.id}
          handleTrainingLogsModal={handleTrainingLogsModal}
          handlePredictionResultModal={handlePredictionResultModal}
        />
      ))}
    </div>
  );
};
