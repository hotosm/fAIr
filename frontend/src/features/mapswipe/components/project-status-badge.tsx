import { Badge } from "@/components/ui/badge";
import { ToolTip } from "@/components/ui/tooltip";
import { MapSwipeProcessingStatus } from "@/enums";
import { TBadgeVariants } from "@/types";
import { formatMapSwipeProjectStatus } from "@/utils/mapswipe-utils";

const greenStatuses = new Set([
  MapSwipeProcessingStatus.PUBLISHED,
  MapSwipeProcessingStatus.FINISHED,
]);

const redStatuses = new Set([
  MapSwipeProcessingStatus.PROCESSING_FAILED,
  MapSwipeProcessingStatus.PUBLISHING_FAILED,
]);

export const statusToVariant = (
  status: MapSwipeProcessingStatus,
): TBadgeVariants => {
  if (greenStatuses.has(status)) return "green";
  if (redStatuses.has(status)) return "red";
  return "yellow";
};

export const MapSwipeProjectStatusBadge = ({
  status,
  isRefetching,
}: {
  status: string;
  isRefetching: boolean;
}) => {
  const formattedStatus = formatMapSwipeProjectStatus(status);
  return (
    <ToolTip
      content={
        isRefetching
          ? "Fetching the latest status..."
          : status === "PROCESSED"
            ? "This project is still a draft. You can ask your manager to approve it or just wait for approval."
            : status === "PUBLISHED"
              ? "The project is published and ready to be contributed. Keep an eye on the progress here."
              : status === "FINISHED"
                ? "The project is finished. Download the results when you're ready."
                : `Current Status: ${formattedStatus}`
      }
    >
      <Badge
        variant={statusToVariant(status as MapSwipeProcessingStatus)}
        className={`${isRefetching ? "cursor-wait" : "cursor-default"}`}
      >
        <span className={`${isRefetching ? "animate-pulse" : ""}`}>
          {formattedStatus}
        </span>
      </Badge>
    </ToolTip>
  );
};
