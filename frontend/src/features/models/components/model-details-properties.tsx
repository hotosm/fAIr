import { useToast } from "@/app/providers/toast-provider";
import { Image } from "@/components/ui/image";
import ToolTip from "@/components/ui/tooltip/tooltip";
import {
  useTrainingDetails,
  useTrainingStatus,
} from "@/features/models/hooks/use-training";
import { useEffect, useMemo, useState } from "react";
import AccuracyDisplay from "./accuracy-display";
import { Link } from "@/components/ui/link";
import { ExternalLinkIcon } from "@/components/ui/icons";
import { ModelPropertiesSkeleton } from "./skeletons";
import CodeBlock from "@/components/ui/codeblock/codeblock";
import ChevronDownIcon from "@/components/ui/icons/chevron-down";
import { APP_CONTENT, cn } from "@/utils";

enum TrainingStatus {
  FAILED = "FAILED",
  IN_PROGRESS = "IN PROGRESS",
}
const LinkDisplay = ({ value, label }: { value: string; label: string }) => {
  return (
    <Link
      href={value as string}
      blank
      nativeAnchor
      className="flex items-center gap-x-3"
      title={label}
    >
      <span className="text-dark font-semibold text-title-3">URL</span>
      <ExternalLinkIcon className="w-4 h-4 " />
    </Link>
  );
};

type PropertyDisplayProps = {
  label: string;
  value?: string | number | null;
  tooltip?: string;
  isAccuracy?: boolean;
  isTMS?: boolean;
  animate?: boolean;
};

const PropertyDisplay: React.FC<PropertyDisplayProps> = ({
  label,
  value,
  tooltip,
  isAccuracy,
  isTMS,
  animate,
}) => (
  <div className="row-span-1 col-span-1 flex flex-col gap-y-5">
    <span className="text-gray text-body-2 flex items-center gap-x-4 text-nowrap ">
      {label}
      {tooltip && <ToolTip content={tooltip} />}
    </span>
    {isAccuracy ? (
      <AccuracyDisplay accuracy={typeof value === "number" ? value : 0} />
    ) : isTMS ? (
      <LinkDisplay value={value as string} label={label} />
    ) : (
      <span
        className={cn(
          `${animate && "animate-pulse"} text-dark font-semibold text-title-3`,
        )}
      >
        {value ?? "N/A"}
      </span>
    )}
  </div>
);

type ModelPropertiesProps = {
  trainingId: number;
  accuracy?: number;
  thumbnailURL?: string;
  isTrainingDetailsDialog?: boolean;
};

const ModelProperties: React.FC<ModelPropertiesProps> = ({
  trainingId,
  thumbnailURL,
  isTrainingDetailsDialog = false,
}) => {
  const { isPending, data, error, isError } = useTrainingDetails(trainingId);

  const { notify } = useToast();

  useEffect(() => {
    //@ts-expect-error bad type definition
    if (isError && error?.response?.data?.detail) {
      //@ts-expect-error bad type definition
      notify(error.response.data.detail, "danger");
    }
  }, [isError, error, notify]);

  const {
    accuracy: trainingAccuracy,
    chips_length,
    zoom_level,
    epochs,
    batch_size,
    input_contact_spacing,
    input_boundary_width,
    source_imagery,
  } = data || {};

  const content = useMemo(() => {
    if (isPending) {
      return <ModelPropertiesSkeleton isTrainingDetailsDialog />;
    }

    return (
      <div
        className={cn(
          `grid ${isTrainingDetailsDialog ? "grid-cols-2" : "grid-cols-1 lg:grid-cols-5"} gap-14 items-center`,
        )}
      >
        <div className="col-span-3 grid grid-cols-1 sm:grid-cols-2 grid-rows-4 gap-y-4 md:gap-y-10">
          <PropertyDisplay
            label={
              APP_CONTENT.models.modelsDetailsCard.properties.zoomLevels.title
            }
            value={zoom_level?.join(" ") || "N/A"}
            tooltip={
              APP_CONTENT.models.modelsDetailsCard.properties.zoomLevels.tooltip
            }
          />
          <PropertyDisplay
            label={
              APP_CONTENT.models.modelsDetailsCard.properties.accuracy.title
            }
            value={trainingAccuracy}
            isAccuracy
          />
          <PropertyDisplay
            label={APP_CONTENT.models.modelsDetailsCard.properties.epochs.title}
            value={epochs}
            tooltip={
              APP_CONTENT.models.modelsDetailsCard.properties.epochs.tooltip
            }
          />
          <PropertyDisplay
            label={
              APP_CONTENT.models.modelsDetailsCard.properties.batchSize.title
            }
            value={batch_size}
            tooltip={
              APP_CONTENT.models.modelsDetailsCard.properties.batchSize.tooltip
            }
          />
          <PropertyDisplay
            label={
              APP_CONTENT.models.modelsDetailsCard.properties.contactSpacing
                .title
            }
            value={input_contact_spacing}
            tooltip={
              APP_CONTENT.models.modelsDetailsCard.properties.contactSpacing
                .tooltip
            }
          />
          <PropertyDisplay
            label={
              APP_CONTENT.models.modelsDetailsCard.properties.boundaryWidth
                .title
            }
            value={input_boundary_width}
            tooltip={
              APP_CONTENT.models.modelsDetailsCard.properties.boundaryWidth
                .tooltip
            }
          />
          <PropertyDisplay
            label={
              APP_CONTENT.models.modelsDetailsCard.properties.currentDatasetSize
                .title
            }
            value={chips_length}
          />
          {/* Animate the status when it's in progress. */}
          {isTrainingDetailsDialog && (
            <PropertyDisplay
              label={
                APP_CONTENT.models.modelsDetailsCard.trainingInfoDialog.status
              }
              value={data?.status}
              animate={data?.status === TrainingStatus.IN_PROGRESS}
            />
          )}
          <PropertyDisplay
            label={
              APP_CONTENT.models.modelsDetailsCard.properties.sourceImage.title
            }
            value={source_imagery}
            isTMS
          />
        </div>
        {thumbnailURL && (
          <div className="col-span-2">
            <div className=" flex lg:justify-end">
              <Image src={thumbnailURL} alt={"Prediction accuracy chart."} />
            </div>
          </div>
        )}
        {/* Show logs only in modal and when status failed */}
        {isTrainingDetailsDialog && data?.status === TrainingStatus.FAILED && (
          //@ts-expect-error bad type definition
          <FailedTrainingTraceBack taskId={data?.task_id} />
        )}
      </div>
    );
  }, [
    isPending,
    trainingAccuracy,
    epochs,
    zoom_level,
    batch_size,
    input_contact_spacing,
    input_boundary_width,
    source_imagery,
    thumbnailURL,
  ]);

  return isError ? (
    <ModelPropertiesSkeleton isTrainingDetailsDialog />
  ) : (
    content
  );
};

export default ModelProperties;

const FailedTrainingTraceBack = ({ taskId }: { taskId: string }) => {
  const { data, isPending } = useTrainingStatus(taskId);
  const [showLogs, setShowLogs] = useState(false);

  if (isPending) {
    return (
      <div className="h-40 col-span-5 w-full animate-pulse bg-light-gray"></div>
    );
  }
  return (
    <div className="col-span-5 flex flex-col gap-y-4">
      <div
        onClick={() => setShowLogs(!showLogs)}
        role="button"
        className="flex items-center gap-x-2"
      >
        <p>{APP_CONTENT.models.modelsDetailsCard.trainingInfoDialog.logs}</p>
        <ChevronDownIcon className={`icon ${showLogs && "rotate-180"}`} />
      </div>
      {showLogs && <CodeBlock content={data?.traceback as string} />}
    </div>
  );
};
