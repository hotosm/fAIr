import { Link } from "@/components/ui/link";
import { APPLICATION_ROUTES } from "@/constants/routes";
import { cn } from "@/utils";
import { MapRequestsTable } from "./map-requests-table";
import { OverviewEmptyState } from "./overview-empty-state";
import { useRecentMapRequests } from "./use-recent-map-requests";
import { ChevronDownIcon } from "@/components/ui/icons";

export const MapRequestsSection = ({
  title = "Map Requests",
  className,
}: {
  title?: string;
  className?: string;
}) => {
  const { requests, isPending, isError, isEmpty } = useRecentMapRequests();
  console.log(requests);

  return (
    <section
      className={cn(
        "rounded-lg border border-gray-border bg-frosted-blue p-4 sm:p-6",
        className,
      )}
    >
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-dark">{title}</h2>
        <Link
          href={APPLICATION_ROUTES.PROFILE_OFFLINE_PREDICTIONS}
          nativeAnchor={false}
          title="View all prediction requests"
          className="flex items-center gap-x-2 text-xs text-grey hover:text-dark"
        >
          <span>View All</span>
          <ChevronDownIcon className=" size-3 -rotate-90  text-dark" />
        </Link>
      </div>

      <div className="bg-fros">
        {isEmpty && !isPending && !isError ? (
          <OverviewEmptyState message="No map request yet" />
        ) : (
          <MapRequestsTable
            requests={requests}
            isPending={isPending}
            isError={isError}
          />
        )}
      </div>
    </section>
  );
};
