import { BackButton } from "@/components/ui/button";
import { Head } from "@/components/seo";
import { useModelsContext } from "@/app/providers/models-provider";
import { useTrainingFeedbacks } from "@/features/models/hooks/use-training";
import { FeedbacksMap } from "@/features/models/components/maps/feedbacks-map";
import { ModelDetailsInfoButton } from "@/features/start-mapping/components/header/model-details-info-button";

export const ModelFeedbacksPage = () => {
  const { data, isPending, isError } = useModelsContext();

  const { data: feedbacksData, isLoading } = useTrainingFeedbacks(
    data?.published_training
  );

  if (isLoading || isPending || isError) {
    return (
      <div className="my-12 flex flex-col gap-y-10">
        <div className="animated-pulse h-24 bg-light-gray md:w-32" />
        <div className="animated-pulse h-80 w-full bg-light-gray " />
      </div>
    );
  }

  return (
    <>
      <Head title={`${data?.name} Model Feedbacks`} />
      <BackButton className="mt-6" />
      <div className="my-8 size-full space-y-10">
        <div>
          <p className="text-body-3 text-grey md:text-body-2">
            Training ID: {data?.published_training}
          </p>
          <div className="flex w-full flex-col gap-y-8 md:flex-row">
            <div className="inline-flex w-full flex-col gap-y-4">
              <div className="flex w-full flex-col gap-y-8 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-col gap-y-3">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center ">
                    <h1 className="text-wrap text-title-2 font-semibold text-dark md:text-large-title">
                      Feedbacks
                    </h1>
                    <div className="flex items-center gap-x-2">
                      <span className="text-body-3 text-grey">
                        Model Details
                      </span>
                      <ModelDetailsInfoButton
                        modelInfo={data}
                        modelInfoRequestIsError={isError}
                        modelInfoRequestIsPending={isPending}
                        predictionModel="Default"
                      />
                    </div>
                  </div>
                  <p className="max-w-lg text-wrap text-body-3 text-grey md:max-w-xl md:text-body-2 xl:max-w-4xl">
                    These are the rejected mapping results for this training by
                    users. Some have comments attached to them.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex w-fit flex-col justify-between gap-y-4 md:items-end ">
              <p className="text-nowrap text-body-4 font-semibold">
                Total Feedbacks: {feedbacksData?.count}
              </p>
            </div>
          </div>
        </div>
        <div className="h-[400px] w-full border-8 border-off-white md:h-[500px]  lg:h-[600px] xl:h-[700px]">
          <FeedbacksMap
            mapData={feedbacksData?.results}
            tileServiceURL={data?.dataset?.source_imagery}
          />
        </div>
      </div>
    </>
  );
};
