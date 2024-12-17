import { Popup } from "@/components/ui/popup";
import { useModelDetails } from "../hooks/use-models";
import { SkeletonWrapper } from "@/components/ui/skeleton";
import { extractDatePart, roundNumber, truncateString } from "@/utils";
import { TModelDetails, TTrainingDataset } from "@/types";
import { useTrainingDetails } from "@/features/models/hooks/use-training";
import { modelPagesContent } from "@/constants";

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
      distance={10}
    >
      {
        <SkeletonWrapper showSkeleton={Boolean(modelId && isPending)}>
          <div className="max-h-[500px] overflow-y-auto border bg-white border-gray-border w-80 shadown-sm shadow-[#433D3D33] rounded-md p-5 flex flex-col">
            {!model && isError ? (
              <div>{modelPagesContent.startMapping.modelDetails.error}</div>
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
                  <p>{modelPagesContent.startMapping.modelDetails.label}</p>
                </div>
                <div className="flex flex-col gap-y-2">
                  <p className="text-gray">
                    {" "}
                    {
                      modelPagesContent.startMapping.modelDetails.popover
                        .modelId
                    }
                    : <span className="text-dark">{model?.id ?? data?.id}</span>
                  </p>
                  <p className="text-gray">
                    {
                      modelPagesContent.startMapping.modelDetails.popover
                        .description
                    }
                    :{" "}
                    <span className="text-dark">
                      {model?.description ?? data?.description}
                    </span>
                  </p>
                  <p className="text-gray">
                    {
                      modelPagesContent.startMapping.modelDetails.popover
                        .lastModified
                    }
                    :{" "}
                    <span className="text-dark">
                      {extractDatePart(
                        model?.last_modified ?? (data?.last_modified as string),
                      )}
                    </span>
                  </p>
                  <p className="text-gray">
                    {
                      modelPagesContent.startMapping.modelDetails.popover
                        .trainingId
                    }
                    :{" "}
                    <span className="text-dark">
                      {model?.published_training ?? data?.published_training}
                    </span>
                  </p>
                  <p className="text-gray">
                    {
                      modelPagesContent.startMapping.modelDetails.popover
                        .datasetId
                    }
                    :{" "}
                    <span className="text-dark">
                      {model?.dataset ?? data?.dataset}
                    </span>
                  </p>
                  <p className="text-gray flex items-center gap-x-1 text-nowrap flex-wrap">
                    {
                      modelPagesContent.startMapping.modelDetails.popover
                        .datasetName
                    }
                    :{" "}
                    <SkeletonWrapper
                      showSkeleton={trainingDatasetIsPending}
                      skeletonClassName="w-20 h-4"
                    >
                      <span
                        className="text-dark text-wrap"
                        title={trainingDataset?.name}
                      >
                        {trainingDatasetIsError
                          ? "N/A"
                          : truncateString(trainingDataset?.name, 40)}{" "}
                      </span>
                    </SkeletonWrapper>
                  </p>

                  <p className="text-gray flex items-center gap-x-1 text-nowrap flex-wrap">
                    {
                      modelPagesContent.startMapping.modelDetails.popover
                        .zoomLevel
                    }
                    :{" "}
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

                  <p className="text-gray">
                    {
                      modelPagesContent.startMapping.modelDetails.popover
                        .accuracy
                    }
                    :{" "}
                    <span className="text-dark">
                      {roundNumber(
                        model?.accuracy ?? (data?.accuracy as number),
                        2,
                      )}
                      %
                    </span>
                  </p>
                  <p className="text-gray">
                    {
                      modelPagesContent.startMapping.modelDetails.popover
                        .baseModel
                    }
                    :{" "}
                    <span className="text-dark">
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
