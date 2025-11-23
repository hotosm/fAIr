import { Badge } from "@/components/ui/badge";
import { ToolTip } from "@/components/ui/tooltip";
import { TBadgeVariants } from "@/types";
import { formatMapSwipeProjectStatus } from "@/utils/mapswipe-utils";

export const MapSwipeProjectStatusBadge = ({
  status,
  isRefetching,
}: {
  status: string;
  isRefetching: boolean;
}) => {
  const statusToVariant: Record<string, TBadgeVariants> = {
    READY_TO_PROCESS: "default",
    DISCARDED: "red",
    PROCESSING_FAILED: "red",
    PUBLISHING_FAILED: "red",
    WITHDRAWN: "red",
    PROCESSED: "green",
    PUBLISHED: "green",
    FINISHED: "green",
    PAUSED: "blue",
    READY_TO_PUBLISH: "yellow",
    DRAFT: "default",
  };
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
      <Badge variant={statusToVariant[status] as TBadgeVariants}>
        <span className={`${isRefetching ? "animate-pulse" : ""}`}>
          {formattedStatus}
        </span>
      </Badge>
    </ToolTip>
  );
};
