import { BackButton } from "@/components/ui/button";
import { Head } from "@/components/seo";
import { useModelsContext } from "@/app/providers/models-provider";
import { useTrainingFeedbacks } from "@/features/models/hooks/use-training";
import { FeedbacksMap } from "@/features/models/components/maps/feedbacks-map";
import { extractTileJSONURL } from "@/utils";
import { ModelDetailsInfoButton } from "@/features/start-mapping/components/header/model-details-info-button";

export const ModelFeedbacksPage = () => {
  const { data, isPending, isError } = useModelsContext();

  const { data: feedbacksData, isLoading } = useTrainingFeedbacks(
    data?.published_training,
  );

  if (isLoading || isPending || isError) {
    return (
      <div className="my-12 flex flex-col gap-y-10">
        <div className="h-24 md:w-32 bg-light-gray animated-pulse" />
        <div className="h-80 w-full bg-light-gray animated-pulse " />
      </div>
    );
  }

  return (
    <>
      <Head title={`${data?.name} Model Feedbacks`} />
      <BackButton className="mt-6" />
      <div className="h-full w-full my-8 space-y-10">
        <div>
          <p className="text-grey text-body-3 md:text-body-2">
            Training ID: {data?.published_training}
          </p>
          <div className="flex gap-y-8 flex-col md:flex-row w-full">
            <div className="inline-flex flex-col gap-y-4 w-full">
              <div className="w-full flex flex-col md:flex-row md:items-center md:justify-between gap-y-8">
                <div className="flex flex-col gap-y-3">
                  <div className="flex flex-col md:flex-row md:items-center gap-4 ">
                    <h1 className="font-semibold text-dark text-title-2 md:text-large-title text-wrap">
                      Feedbacks
                    </h1>
                    <div className="flex gap-x-2 items-center">
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
                  <p className="text-body-3 text-grey md:text-body-2 text-wrap max-w-lg md:max-w-xl xl:max-w-4xl">
                    These are the rejected mapping results for this training by
                    users. Some have comments attached to them.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex w-fit flex-col gap-y-4 justify-between md:items-end ">
              <p className="text-body-4 font-semibold text-nowrap">
                Total Feedbacks: {feedbacksData?.count}
              </p>
              {/* <ButtonWithIcon
                label={MODELS_CONTENT.models.modelsDetailsCard.enhanceModel}
                variant={ButtonVariant.DARK}
                size="medium"
                prefixIcon={StarStackIcon}
                // Navigate to training area page for the model ?
                // onClick={openModelEnhancementDialog}
                disabled={!isAuthenticated}
              /> */}
            </div>
          </div>
        </div>
        <div className="w-full h-[400px] md:h-[500px] lg:h-[600px] xl:h-[700px]  border-8 border-off-white">
          <FeedbacksMap
            mapData={feedbacksData?.results}
            openAerialMapTileJSONURL={extractTileJSONURL(
              data?.dataset?.source_imagery,
            )}
          />
        </div>
      </div>
    </>
  );
};
