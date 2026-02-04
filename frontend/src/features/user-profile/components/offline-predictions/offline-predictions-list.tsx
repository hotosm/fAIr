import { Button } from "@/components/ui/button";
import { NoTrainingAreaIcon } from "@/components/ui/icons";
import { TOfflinePrediction } from "@/types";
import { OfflinePredictionsListSkeleton } from "@/features/user-profile/components/offline-predictions/offline-prediction-list-skeleton";
import { OfflinePredictionCard } from "@/features/user-profile/components/offline-predictions/offline-prediction-card";

export const OfflinePredictionsList = ({
  data,
  isPending,
  isError,
  refetch,
  handleTrainingLogsModal,
  handlePredictionResultModal,
  handleCreateOrViewMapSwipeProject,
}: {
  data: TOfflinePrediction[];
  isPending: boolean;
  isError: boolean;
  refetch: () => void;
  handleTrainingLogsModal: (taskId: string) => void;
  handlePredictionResultModal: (prediction: TOfflinePrediction) => void;
  handleCreateOrViewMapSwipeProject: (prediction: TOfflinePrediction) => void;
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
      <div className="flex flex-col items-center justify-center w-full h-full gap-y-10">
        Error loading prediction requests.
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
      <div className="flex flex-col  gap-y-10 items-center justify-center">
        <NoTrainingAreaIcon />
        <p>No prediction requests found.</p>
      </div>
    );
  }

  /**
   * Dataset list
   */
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] md:grid-cols-[repeat(auto-fill,minmax(299px,1fr))] gap-6">
      {data.map((data) => (
        <OfflinePredictionCard
          predictionResult={data}
          key={data.id}
          handleTrainingLogsModal={handleTrainingLogsModal}
          handlePredictionResultModal={handlePredictionResultModal}
          handleCreateOrViewMapSwipeProject={handleCreateOrViewMapSwipeProject}
        />
      ))}
    </div>
  );
};
