import useScreenSize from "@/hooks/use-screen-size";
import { ELEMENT_DISTANCE_FROM_NAVBAR } from "@/config";
import { extractDatePart, roundNumber, truncateString } from "@/utils";
import { MobileDrawer } from "@/components/ui/drawer";
import { SkeletonWrapper } from "@/components/ui/skeleton";
import { TModelDetails } from "@/types";
import { useTrainingDetails } from "@/features/models/hooks/use-training";
import { START_MAPPING_PAGE_CONTENT } from "@/constants";
import { SlPopup } from "@shoelace-style/shoelace/dist/react";

const ModelDetailsPopUp = ({
  showPopup,
  anchor,
  handlePopup,
  modelInfo,
  modelInfoRequestIsError,
  modelInfoRequestIsPending,
  closeMobileDrawer,
}: {
  showPopup: boolean;
  anchor: string;
  handlePopup: () => void;
  modelInfo?: TModelDetails;
  modelInfoRequestIsPending?: boolean;
  modelInfoRequestIsError?: boolean;
  closeMobileDrawer: () => void;
}) => {
  const {
    data: trainingDetails,
    isPending: trainingDetailsIsPending,
    isError: trainingDetailsError,
  } = useTrainingDetails(modelInfo?.published_training as number);

  const { isSmallViewport } = useScreenSize();

  const popupContent = (
    <SkeletonWrapper
      showSkeleton={modelInfoRequestIsPending}
      skeletonClassName="h-40"
    >
      <div className="flex flex-col gap-y-3 text-dark font-normal text-body-3">
        <p>
          {START_MAPPING_PAGE_CONTENT.modelDetails.popover.modelId}:{" "}
          <span className="font-medium">{modelInfo?.id}</span>
        </p>
        <p>
          {START_MAPPING_PAGE_CONTENT.modelDetails.popover.description}:{" "}
          <span className="font-medium">{modelInfo?.description}</span>
        </p>
        <p>
          {START_MAPPING_PAGE_CONTENT.modelDetails.popover.lastModified}:{" "}
          <span className="font-medium">
            {extractDatePart(modelInfo?.last_modified as string)}
          </span>
        </p>
        <p>
          {START_MAPPING_PAGE_CONTENT.modelDetails.popover.trainingId}:{" "}
          <span className="font-medium">{modelInfo?.published_training}</span>
        </p>
        <p>
          {START_MAPPING_PAGE_CONTENT.modelDetails.popover.datasetId}:{" "}
          <span className="font-medium">{modelInfo?.dataset.id}</span>
        </p>
        <p className="flex items-center gap-x-1 text-nowrap flex-wrap">
          {START_MAPPING_PAGE_CONTENT.modelDetails.popover.datasetName}:{" "}
          <SkeletonWrapper
            showSkeleton={modelInfoRequestIsPending}
            skeletonClassName="w-20 h-4"
          >
            <span
              className="text-dark font-medium text-wrap"
              title={modelInfo?.dataset?.name}
            >
              {modelInfoRequestIsError
                ? "N/A"
                : truncateString(modelInfo?.dataset?.name, 40)}{" "}
            </span>
          </SkeletonWrapper>
        </p>

        <p className="flex items-center gap-x-1 text-nowrap flex-wrap">
          {START_MAPPING_PAGE_CONTENT.modelDetails.popover.zoomLevel}:{" "}
          <SkeletonWrapper
            showSkeleton={trainingDetailsIsPending}
            skeletonClassName="w-20 h-4"
          >
            <span className="text-dark font-medium">
              {trainingDetailsError
                ? "N/A"
                : trainingDetails?.zoom_level?.reverse().join(", ")}{" "}
            </span>
          </SkeletonWrapper>
        </p>

        <p>
          {START_MAPPING_PAGE_CONTENT.modelDetails.popover.accuracy}:{" "}
          <span className="font-medium">
            {roundNumber(modelInfo?.accuracy as number, 2)}%
          </span>
        </p>
        <p>
          {START_MAPPING_PAGE_CONTENT.modelDetails.popover.baseModel}:{" "}
          <span className="font-medium">{modelInfo?.base_model}</span>
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
        snapPoints={[0.5, 1]}
        canClose
      >
        <div className={`app-padding flex flex-col`}>
          {!modelInfo && modelInfoRequestIsError ? (
            <div>{START_MAPPING_PAGE_CONTENT.modelDetails.error}</div>
          ) : (
            <div className="flex flex-col gap-y-4 text-dark">
              <p className="font-semibold">
                {START_MAPPING_PAGE_CONTENT.modelDetails.label}
              </p>
              {popupContent}
            </div>
          )}
        </div>
      </MobileDrawer>
    );
  }

  return (
    <SlPopup
      arrow={false}
      flip
      shift
      active={showPopup}
      anchor={anchor}
      placement="bottom-start"
      distance={ELEMENT_DISTANCE_FROM_NAVBAR}
      strategy="fixed"
      autoSize="both"
      id="model-details-popup"
    >
      <div
        className={
          "border bg-white border-gray-border shadown-sm rounded-xl w-[350px] scrollable p-5 max-h-[400px] overflow-y-auto flex flex-col"
        }
      >
        {!modelInfo && modelInfoRequestIsError ? (
          <div>{START_MAPPING_PAGE_CONTENT.modelDetails.error}</div>
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
                  {START_MAPPING_PAGE_CONTENT.modelDetails.label}
                </p>
              </div>
            </div>
            {popupContent}
          </div>
        )}
      </div>
    </SlPopup>
  );
};

export default ModelDetailsPopUp;
