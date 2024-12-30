import { Button } from "@/components/ui/button";
import { MODELS_CONTENT } from "@/constants";
import { useTrainingFeedbacks } from "@/features/models/hooks/use-training";

const ModelFeedbacks = ({ trainingId }: { trainingId: number }) => {
  const { data, isLoading } = useTrainingFeedbacks(trainingId);

  if (isLoading) {
    return <div className="w-20 h-6 animate-pulse bg-light-gray"></div>;
  }

  return (
    <div className="max-w-fit">
      <div className="max-w-fit">
        <Button variant="dark" size="medium" disabled={trainingId === null}>
          {`${MODELS_CONTENT.models.modelsDetailsCard.feedbacks} (${data?.count ?? 0})`}
        </Button>
      </div>
    </div>
  );
};

export default ModelFeedbacks;
