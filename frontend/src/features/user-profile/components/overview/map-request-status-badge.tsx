import { Badge } from "@/components/ui/badge";
import { PredictionRequestStatus } from "@/enums";
import { TBadgeVariants } from "@/types";

const STATUS_PRESENTATION: Record<
  string,
  { label: string; variant: TBadgeVariants }
> = {
  [PredictionRequestStatus.COMPLETED]: { label: "Completed", variant: "green" },
  [PredictionRequestStatus.CACHED]: { label: "Completed", variant: "green" },
  [PredictionRequestStatus.INITIALIZING]: {
    label: "Initializing",
    variant: "yellow",
  },
  [PredictionRequestStatus.SUBMITTED]: {
    label: "In Progress",
    variant: "yellow",
  },
  [PredictionRequestStatus.PROVISIONING]: {
    label: "In Progress",
    variant: "yellow",
  },
  [PredictionRequestStatus.RUNNING]: {
    label: "In Progress",
    variant: "yellow",
  },
  [PredictionRequestStatus.RETRYING]: {
    label: "In Progress",
    variant: "yellow",
  },
  [PredictionRequestStatus.RETRIED]: {
    label: "In Progress",
    variant: "yellow",
  },
  [PredictionRequestStatus.STOPPING]: { label: "Stopping", variant: "yellow" },
  [PredictionRequestStatus.FAILED]: { label: "Failed", variant: "red" },
  [PredictionRequestStatus.STOPPED]: { label: "Stopped", variant: "red" },
};

const toTitleCase = (value: string) =>
  value.charAt(0).toUpperCase() + value.slice(1);

export const MapRequestStatusBadge = ({ status }: { status: string }) => {
  const presentation = STATUS_PRESENTATION[status?.toLowerCase()] ?? {
    label: status ? toTitleCase(status) : "Unknown",
    variant: "default" as TBadgeVariants,
  };

  return (
    <Badge
      variant={presentation.variant}
      rounded
      className="!h-fit font-medium !px-3"
    >
      {presentation.label}
    </Badge>
  );
};
