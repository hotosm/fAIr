import { Popup } from "@/components/ui/popup";
import { useModelDetails } from "../hooks/use-models";
import { SkeletonWrapper } from "@/components/ui/skeleton";
import { extractDatePart, roundNumber, truncateString } from "@/utils";
import { TModelDetails, TTrainingDataset } from "@/types";
import { useTrainingDetails } from "@/features/models/hooks/use-training";
import { startMappingPageContent } from "@/constants";

const ModelDetailsPopUp = ({
  showPopup,
  anchor,
  closePopup,
  modelId,
  model,
  trainingDatasetIsError,
  trainingDataset,
  trainingDatasetIsPending,
}: {
  showPopup: boolean;
  anchor: string;
  closePopup: () => void;
  modelId?: string;
  model?: TModelDetails;
  trainingDataset?: TTrainingDataset;
  trainingDatasetIsPending?: boolean;
  trainingDatasetIsError?: boolean;
}) => {
  const { data, isPending, isError } = useModelDetails(
    modelId as string,
    modelId ? modelId !== undefined : false,
  );

  const {
    data: trainingDetails,
    isPending: trainingDetailsIsPending,
    isError: trainingDetailsError,
  } = useTrainingDetails(
    model?.published_training ?? (data?.published_training as number),
  );

  return (
    <Popup
      active={showPopup}
      anchor={anchor}
      placement="bottom-start"
      // Distance is based on the navbar height.
      distance={40}
    >
      {
        <SkeletonWrapper showSkeleton={Boolean(modelId && isPending)}>
          <div className="max-h-[400px] scrollable overflow-y-auto border bg-white border-gray-border w-[350px] shadown-sm shadow-[#433D3D33] rounded-xl p-7 flex flex-col">
            {!model && isError ? (
              <div>{startMappingPageContent.modelDetails.error}</div>
            ) : (
              <div className="flex flex-col gap-y-4 text-dark">
                <div className="flex justify-between flex-row-reverse items-center">
                  <button
                    className="text-dark text-lg self-end"
                    onClick={closePopup}
                    title="Close"
                  >
                    &#x2715;
                  </button>
                  <p className="font-semibold">
                    {startMappingPageContent.modelDetails.label}
                  </p>
                </div>
                <div className="flex flex-col gap-y-3 text-dark font-normal">
                  <p>
                    {" "}
                    {startMappingPageContent.modelDetails.popover.modelId}:{" "}
                    <span className="font-medium">{model?.id ?? data?.id}</span>
                  </p>
                  <p>
                    {startMappingPageContent.modelDetails.popover.description}:{" "}
                    <span className="font-medium">
                      {model?.description ?? data?.description}
                    </span>
                  </p>
                  <p>
                    {startMappingPageContent.modelDetails.popover.lastModified}:{" "}
                    <span className="font-medium">
                      {extractDatePart(
                        model?.last_modified ?? (data?.last_modified as string),
                      )}
                    </span>
                  </p>
                  <p>
                    {startMappingPageContent.modelDetails.popover.trainingId}:{" "}
                    <span className="font-medium">
                      {model?.published_training ?? data?.published_training}
                    </span>
                  </p>
                  <p>
                    {startMappingPageContent.modelDetails.popover.datasetId}:{" "}
                    <span className="font-medium">
                      {model?.dataset ?? data?.dataset}
                    </span>
                  </p>
                  <p className="flex items-center gap-x-1 text-nowrap flex-wrap">
                    {startMappingPageContent.modelDetails.popover.datasetName}:{" "}
                    <SkeletonWrapper
                      showSkeleton={trainingDatasetIsPending}
                      skeletonClassName="w-20 h-4"
                    >
                      <span
                        className="text-dark font-medium text-wrap"
                        title={trainingDataset?.name}
                      >
                        {trainingDatasetIsError
                          ? "N/A"
                          : truncateString(trainingDataset?.name, 40)}{" "}
                      </span>
                    </SkeletonWrapper>
                  </p>

                  <p className="flex items-center gap-x-1 text-nowrap flex-wrap">
                    {startMappingPageContent.modelDetails.popover.zoomLevel}:{" "}
                    <SkeletonWrapper
                      showSkeleton={trainingDetailsIsPending}
                      skeletonClassName="w-20 h-4"
                    >
                      <span className="text-dark">
                        {trainingDetailsError
                          ? "N/A"
                          : trainingDetails?.zoom_level?.join(", ")}{" "}
                      </span>
                    </SkeletonWrapper>
                  </p>

                  <p>
                    {startMappingPageContent.modelDetails.popover.accuracy}:{" "}
                    <span className="font-medium">
                      {roundNumber(
                        model?.accuracy ?? (data?.accuracy as number),
                        2,
                      )}
                      %
                    </span>
                  </p>
                  <p>
                    {startMappingPageContent.modelDetails.popover.baseModel}:{" "}
                    <span className="font-medium">
                      {model?.base_model ?? data?.base_model}
                    </span>
                  </p>
                </div>
              </div>
            )}
          </div>
        </SkeletonWrapper>
      }
    </Popup>
  );
};

export default ModelDetailsPopUp;
