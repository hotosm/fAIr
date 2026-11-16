import { Badge } from "@/components/ui/badge";
import { ToolTip } from "@/components/ui/tooltip";
import { useTryFairParams } from "@/features/try-fair/hooks/use-try-fair-params";
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

export const MapRequestStatusBadge = ({
  status,
  size = "default",
  error,
}: {
  status: string;
  /** "small" is the compact pill used on the mobile cards. */
  size?: "default" | "small";
  error?: string | null;
}) => {
  const presentation = STATUS_PRESENTATION[status?.toLowerCase()] ?? {
    label: status ? toTitleCase(status) : "Unknown",
    variant: "default" as TBadgeVariants,
  };

  const { mappingMode } = useTryFairParams();
  const badge = (
    <Badge
      variant={presentation.variant}
      rounded
      className={
        size === "small"
          ? "!h-fit !px-2.5 !py-1 [&_span]:!text-[11px] [&_span]:!leading-none"
          : "!h-fit font-medium !px-3"
      }
    >
      {presentation.label}
    </Badge>
  );
  const showsReason =
    mappingMode === "advanced" &&
    status?.toLowerCase() === PredictionRequestStatus.FAILED &&
    Boolean(error);
  return showsReason ? (
    <ToolTip content={error} pinOnClick>
      {badge}
    </ToolTip>
  ) : (
    badge
  );
};
