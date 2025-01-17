import AccuracyDisplay from "./accuracy-display";
import CodeBlock from "@/components/ui/codeblock/codeblock";
import ModelFilesButton from "./model-files-button";
import ToolTip from "@/components/ui/tooltip/tooltip";
import useCopyToClipboard from "@/hooks/use-clipboard";
import { ChevronDownIcon } from "@/components/ui/icons";
import { cn, showErrorToast } from "@/utils";
import { CopyIcon, ExternalLinkIcon } from "@/components/ui/icons";
import { ENVS } from "@/config/env";
import { Image, ZoomableImage } from "@/components/ui/image";
import { Link } from "@/components/ui/link";
import { ModelFilesDialog } from "./dialogs";
import { ModelPropertiesSkeleton } from "./skeletons";
import { MODELS_CONTENT } from "@/constants";
import { TrainingAreaButton } from "./training-area-button";
import { TrainingAreaDrawer } from "./training-area-drawer";
import { useDialog } from "@/hooks/use-dialog";
import { useEffect, useState } from "react";
import {
  useTrainingDetails,
  useTrainingStatus,
} from "@/features/models/hooks/use-training";

enum TrainingStatus {
  FAILED = "FAILED",
  IN_PROGRESS = "IN PROGRESS",
  RUNNING = "RUNNING",
  SUCCESS = "SUCCESS",
  FINISHED = "FINISHED",
}

type PropertyDisplayProps = {
  label: string;
  value?: string | number | null;
  tooltip?: string;
  isAccuracy?: boolean;
  isLink?: boolean;
  animate?: boolean;
  href?: string;
  isCopy?: boolean;
};

const PropertyDisplay: React.FC<PropertyDisplayProps> = ({
  label,
  value,
  tooltip,
  isAccuracy,
  isLink,
  animate,
  href,
  isCopy,
}) => {
  const { copyToClipboard } = useCopyToClipboard();
  return (
    <div className="row-span-1 col-span-1 flex flex-col gap-y-5">
      <span className="text-gray text-body-2base md:text-body-2 flex items-center gap-x-4 text-nowrap ">
        {label}
        {tooltip && <ToolTip content={tooltip} />}
      </span>
      {isAccuracy ? (
        <AccuracyDisplay accuracy={typeof value === "number" ? value : 0} />
      ) : isLink ? (
        <Link
          href={href as string}
          blank
          nativeAnchor
          className="flex items-center gap-x-3"
          title={label}
        >
          <span className="text-dark font-semibold text-body-2 md:text-body-1">
            {value}
          </span>
          <ExternalLinkIcon className="icon" />
        </Link>
      ) : isCopy ? (
        <div className="flex items-center gap-x-3">
          <span className="text-dark font-semibold text-body-2 md:text-body-1">
            URL
          </span>
          <button onClick={() => copyToClipboard(value as string)}>
            <CopyIcon className="icon md:icon-lg" />
          </button>
        </div>
      ) : (
        <span
          className={cn(
            `${animate && "animate-pulse"} text-dark font-semibold text-body-2 md:text-body-1`,
          )}
        >
          {value ?? "N/A"}
        </span>
      )}
    </div>
  );
};
type ModelPropertiesProps = {
  trainingId: number;
  accuracy?: number;
  datasetId?: number;
  isTrainingDetailsDialog?: boolean;
  baseModel: string;
  tmsUrl?: string;
};

const ModelProperties: React.FC<ModelPropertiesProps> = ({
  trainingId,
  datasetId,
  isTrainingDetailsDialog = false,
  baseModel,
  tmsUrl,
}) => {
  const { isPending, data, error, isError } = useTrainingDetails(
    trainingId,
    10000,
  );

  const { isOpened, closeDialog, openDialog } = useDialog();

  const {
    isOpened: isTrainingAreaDrawerOpened,
    closeDialog: closeTrainingAreaDrawer,
    openDialog: openTrainingAreaDrawer,
  } = useDialog();

  useEffect(() => {
    if (isError) {
      showErrorToast(error);
    }
  }, [isError, error]);

  const {
    accuracy: trainingAccuracy,
    zoom_level,
    epochs,
    batch_size,
    input_contact_spacing,
    input_boundary_width,
    source_imagery,
    chips_length,
  } = data || {};

  const trainingResultsGraph = `${ENVS.BASE_API_URL}workspace/download/training_${data?.id}/graphs/training_accuracy.png`;

  return isError || isPending ? (
    <ModelPropertiesSkeleton isTrainingDetailsDialog />
  ) : (
    <>
      <TrainingAreaDrawer
        isOpened={isTrainingAreaDrawerOpened}
        closeDialog={closeTrainingAreaDrawer}
        trainingAreaId={trainingId}
        tmsURL={tmsUrl as string}
      />

      <ModelFilesDialog
        closeDialog={closeDialog}
        isOpened={isOpened}
        trainingId={trainingId}
        datasetId={datasetId as number}
      />
      <>
        <div
          className={cn(
            `grid ${isTrainingDetailsDialog ? "grid-cols-2" : "grid-cols-1 lg:grid-cols-5"} gap-14 items-center `,
          )}
        >
          <div className="col-span-3 grid grid-cols-1 sm:grid-cols-2 grid-rows-4 gap-y-4 md:gap-y-8">
            <PropertyDisplay
              label={
                MODELS_CONTENT.models.modelsDetailsCard.properties.zoomLevels
                  .title
              }
              value={zoom_level?.join(" ") || "N/A"}
              tooltip={
                MODELS_CONTENT.models.modelsDetailsCard.properties.zoomLevels
                  .tooltip
              }
            />
            <PropertyDisplay
              label={
                MODELS_CONTENT.models.modelsDetailsCard.properties.accuracy
                  .title
              }
              tooltip={
                MODELS_CONTENT.models.modelsDetailsCard.properties.accuracy
                  .tooltip
              }
              value={trainingAccuracy}
              isAccuracy
            />
            <PropertyDisplay
              label={
                MODELS_CONTENT.models.modelsDetailsCard.properties.epochs.title
              }
              value={epochs}
              tooltip={
                MODELS_CONTENT.models.modelsDetailsCard.properties.epochs
                  .tooltip
              }
            />
            <PropertyDisplay
              label={
                MODELS_CONTENT.models.modelsDetailsCard.properties.batchSize
                  .title
              }
              value={batch_size}
              tooltip={
                MODELS_CONTENT.models.modelsDetailsCard.properties.batchSize
                  .tooltip
              }
            />
            <PropertyDisplay
              label={
                MODELS_CONTENT.models.modelsDetailsCard.properties
                  .contactSpacing.title
              }
              value={input_contact_spacing}
              tooltip={
                MODELS_CONTENT.models.modelsDetailsCard.properties
                  .contactSpacing.tooltip
              }
            />
            <PropertyDisplay
              label={
                MODELS_CONTENT.models.modelsDetailsCard.properties.boundaryWidth
                  .title
              }
              value={input_boundary_width}
              tooltip={
                MODELS_CONTENT.models.modelsDetailsCard.properties.boundaryWidth
                  .tooltip
              }
            />
            <PropertyDisplay
              label={
                MODELS_CONTENT.models.modelsDetailsCard.properties
                  .currentDatasetSize.title
              }
              value={`${chips_length} Images`}
              tooltip={
                MODELS_CONTENT.models.modelsDetailsCard.properties
                  .currentDatasetSize.tooltip
              }
            />
            {/* Animate the status when it's in progress. */}
            {isTrainingDetailsDialog && (
              <PropertyDisplay
                label={
                  MODELS_CONTENT.models.modelsDetailsCard.trainingInfoDialog
                    .status
                }
                value={data?.status}
                animate={
                  data?.status === TrainingStatus.IN_PROGRESS ||
                  data?.status === TrainingStatus.RUNNING
                }
              />
            )}
            <PropertyDisplay
              label={
                MODELS_CONTENT.models.modelsDetailsCard.properties.baseModel
                  .title
              }
              value={baseModel}
              isLink
              href={
                // @ts-expect-error bad type definition
                MODELS_CONTENT.models.modelsDetailsCard.properties.baseModel
                  .href[baseModel]
              }
            />

            <PropertyDisplay
              label={
                MODELS_CONTENT.models.modelsDetailsCard.properties.sourceImage
                  .title
              }
              tooltip={
                MODELS_CONTENT.models.modelsDetailsCard.properties.sourceImage
                  .tooltip
              }
              value={source_imagery}
              isCopy
            />
            <PropertyDisplay
              label={
                MODELS_CONTENT.models.modelsDetailsCard.properties.trainingId
                  .title
              }
              tooltip={
                MODELS_CONTENT.models.modelsDetailsCard.properties.trainingId
                  .tooltip
              }
              value={data?.id ? data?.id : "N/A"}
            />

            {isTrainingDetailsDialog && (
              <div className="w-fit">
                <ModelFilesButton
                  disabled={data?.status !== TrainingStatus.FINISHED}
                  openModelFilesDialog={openDialog}
                />
              </div>
            )}

            {isTrainingDetailsDialog && (
              <TrainingAreaButton
                onClick={openTrainingAreaDrawer}
                disabled={data?.status !== TrainingStatus.FINISHED}
              />
            )}
          </div>

          {trainingResultsGraph &&
            ![TrainingStatus.RUNNING, TrainingStatus.FAILED].includes(
              data?.status as TrainingStatus,
            ) && (
              <div
                className={`col-span-3 lg:col-span-2 ${isTrainingDetailsDialog && "lg:col-span-3"}`}
              >
                <ZoomableImage>
                  <Image src={trainingResultsGraph} alt={data.description} />
                </ZoomableImage>
              </div>
            )}

          {/* Show logs only in modal and when status failed or running */}
          {isTrainingDetailsDialog &&
            (data?.status === TrainingStatus.FAILED ||
              data?.status === TrainingStatus.RUNNING) && (
              <FailedTrainingTraceBack taskId={data?.task_id ?? ""} />
            )}
        </div>
      </>
    </>
  );
};

export default ModelProperties;

const FailedTrainingTraceBack = ({ taskId }: { taskId: string }) => {
  const { data, isPending } = useTrainingStatus(taskId);
  const [showLogs, setShowLogs] = useState<boolean>(false);

  if (isPending) {
    return (
      <div className="h-40 col-span-5 w-full animate-pulse bg-light-gray"></div>
    );
  }
  return (
    <div className="col-span-3 flex flex-col gap-y-2 w-full">
      <button
        onClick={() => setShowLogs(!showLogs)}
        className="flex items-center gap-x-2 text-gray text-body-2"
      >
        <p>{MODELS_CONTENT.models.modelsDetailsCard.trainingInfoDialog.logs}</p>
        <ChevronDownIcon className={`icon ${showLogs && "rotate-180"}`} />
      </button>
      {showLogs && <CodeBlock content={data?.traceback as string} />}
    </div>
  );
};
