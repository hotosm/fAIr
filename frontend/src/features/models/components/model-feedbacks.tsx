import { Button } from "@/components/ui/button";
import { APPLICATION_ROUTES, MODELS_CONTENT } from "@/constants";
import { ButtonVariant } from "@/enums";
import { useTrainingFeedbacks } from "@/features/models/hooks/use-training";
import { useLocation, useNavigate } from "react-router-dom";

const ModelFeedbacks = ({ trainingId }: { trainingId: number }) => {
  const { data, isLoading } = useTrainingFeedbacks(trainingId);
  const navigate = useNavigate();
  const currentPath = useLocation().pathname;
  if (isLoading) {
    return <div className="w-20 h-6 animate-pulse bg-light-gray"></div>;
  }

  return (
    <div className="max-w-fit">
      <div className="max-w-fit">
        <Button
          variant={ButtonVariant.DARK}
          size="medium"
          disabled={trainingId === null || data?.count === 0}
          onClick={() => {
            navigate(
              `${currentPath}/${APPLICATION_ROUTES.MODEL_FEEDBACKS_BASE_ROUTE}`,
            );
          }}
        >
          {`${MODELS_CONTENT.models.modelsDetailsCard.feedbacks} (${data?.count ?? 0})`}
        </Button>
      </div>
    </div>
  );
};

export default ModelFeedbacks;
