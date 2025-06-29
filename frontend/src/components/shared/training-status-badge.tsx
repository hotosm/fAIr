import { TBadgeVariants } from "@/types";
import { Badge } from "@/components/ui/badge";

export const TrainingStatusBadge = ({ status }: { status: string }) => {
  const statusToVariant: Record<string, TBadgeVariants> = {
    finished: "green",
    failed: "red",
    submitted: "blue",
    running: "yellow",
  };

  return (
    <Badge
      variant={statusToVariant[status.toLocaleLowerCase()] as TBadgeVariants}
    >
      {status.toLocaleLowerCase() as string}
    </Badge>
  );
};
