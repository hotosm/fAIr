import { ButtonWithIcon } from "@/components/ui/button";
import { ChatbubbleIcon } from "@/components/ui/icons";
import { useTrainingFeedbacks } from "@/features/models/hooks/use-training";
import { APP_CONTENT } from "@/utils";

const ModelFeedbacks = ({ trainingId }: { trainingId: number }) => {
  const { data, isLoading, isError } = useTrainingFeedbacks(trainingId);

  if (isLoading) {
    return <div className="w-20 h-6 animate-pulse bg-light-gray"></div>;
  }

  return (
    <>
      <p className="text-dark text-body-2">
        {isError ? "N/A" : (data?.count ?? 0)}
        <span className="text-gray">
          {APP_CONTENT.models.modelsDetailsCard.feedbacks}
        </span>
      </p>
      <div className="max-w-fit">
        <ButtonWithIcon
          label={APP_CONTENT.models.modelsDetailsCard.feedbacks}
          variant="dark"
          size="medium"
          prefixIcon={ChatbubbleIcon}
          disabled={trainingId === null}
        />
      </div>
    </>
  );
};

export default ModelFeedbacks;
