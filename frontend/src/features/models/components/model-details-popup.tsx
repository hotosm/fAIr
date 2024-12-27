import { Popup } from "@/components/ui/popup";
import { useModelDetails } from "@/features/models/hooks/use-models";
import { SkeletonWrapper } from "@/components/ui/skeleton";
import { extractDatePart, roundNumber, truncateString } from "@/utils";
import { TModelDetails, TTrainingDataset } from "@/types";
import { useTrainingDetails } from "@/features/models/hooks/use-training";
import { startMappingPageContent } from "@/constants";
import useScreenSize from "@/hooks/use-screen-size";
import { MobileDrawer } from "@/components/ui/drawer";

const ModelDetailsPopUp = ({
  showPopup,
  anchor,
  handlePopup,
  modelId,
  model,
  trainingDatasetIsError,
  trainingDataset,
  trainingDatasetIsPending,
  closeMobileDrawer,
}: {
  showPopup: boolean;
  anchor: string;
  handlePopup: () => void;
  modelId?: string;
  model?: TModelDetails;
  trainingDataset?: TTrainingDataset;
  trainingDatasetIsPending?: boolean;
  trainingDatasetIsError?: boolean;
  closeMobileDrawer: () => void;
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
  const { isSmallViewport } = useScreenSize();

  const popupContent = (
    <SkeletonWrapper showSkeleton={Boolean(modelId && isPending)}>
      <div className="flex flex-col gap-y-3 text-dark font-normal text-body-3">
        <p>
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
          <span className="font-medium">{model?.dataset ?? data?.dataset}</span>
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
            <span className="text-dark font-medium">
              {trainingDetailsError
                ? "N/A"
                : trainingDetails?.zoom_level?.join(", ")}{" "}
            </span>
          </SkeletonWrapper>
        </p>

        <p>
          {startMappingPageContent.modelDetails.popover.accuracy}:{" "}
          <span className="font-medium">
            {roundNumber(model?.accuracy ?? (data?.accuracy as number), 2)}%
          </span>
        </p>
        <p>
          {startMappingPageContent.modelDetails.popover.baseModel}:{" "}
          <span className="font-medium">
            {model?.base_model ?? data?.base_model}
          </span>
        </p>
      </div>
    </SkeletonWrapper>
  );

  if (isSmallViewport) {
    return (
      <MobileDrawer
        open={showPopup}
        dialogTitle="Model Details"
        closeDrawer={closeMobileDrawer}
        snapPoints={[0.5, 0.8]}
        canClose
      >
        <div className={`app-padding flex flex-col`}>
          {!model && isError ? (
            <div>{startMappingPageContent.modelDetails.error}</div>
          ) : (
            <div className="flex flex-col gap-y-4 text-dark">
              <p className="font-semibold">
                {startMappingPageContent.modelDetails.label}
              </p>
              {popupContent}
            </div>
          )}
        </div>
      </MobileDrawer>
    );
  }

  return (
    <Popup
      active={showPopup}
      anchor={anchor}
      placement="bottom-start"
      distance={40}
    >
      <div
        className={`border bg-white border-gray-border shadown-sm rounded-xl w-[350px] scrollable p-5 max-h-[400px] overflow-y-auto flex flex-col`}
      >
        {!model && isError ? (
          <div>{startMappingPageContent.modelDetails.error}</div>
        ) : (
          <div className="flex flex-col gap-y-4 text-dark">
            <div>
              <div className="flex justify-between flex-row-reverse items-center">
                <button
                  className="text-dark text-lg self-end"
                  onClick={handlePopup}
                  title="Close"
                >
                  &#x2715;
                </button>
                <p className="font-semibold">
                  {startMappingPageContent.modelDetails.label}
                </p>
              </div>
            </div>
            {popupContent}
          </div>
        )}
      </div>
    </Popup>
  );
};

export default ModelDetailsPopUp;
