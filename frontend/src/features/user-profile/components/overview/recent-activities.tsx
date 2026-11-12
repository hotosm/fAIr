import { ChevronDownIcon } from "@/components/ui/icons";
import useScreenSize from "@/hooks/use-screen-size";
import { Link, useNavigate } from "react-router-dom";
import { DataTable } from "@/components/ui/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import type { SavedUserState } from "@/features/try-fair/api/user-state";
import { cn } from "@/utils";
import { APPLICATION_ROUTES } from "@/constants/routes";
import { useGetUserStates } from "@/features/user-profile/api/user-state";
import { TableSkeleton } from "@/features/models/components/skeletons";
import { OverviewEmptyState } from "@/features/user-profile/components/overview/overview-empty-state";
import {
  MappingTypeBadge,
  getProjectPath,
  MappingHistoryList,
} from "@/features/user-profile/components/overview/mapping-history-list";

const columns: ColumnDef<SavedUserState>[] = [
  {
    accessorKey: "state.name",
    header: "Name",
    cell: ({ row }) => (
      <span className="block truncate" title={row.original.state.name}>
        {row.original.state.name}
      </span>
    ),
  },
  {
    accessorKey: "state.type",
    header: "Type",
    cell: ({ row }) => <MappingTypeBadge activity={row.original} />,
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Open mapping project</span>,
    cell: ({ row }) => (
      <Link
        to={getProjectPath(row.original)}
        aria-label={`Open mapping project ${row.original.state.name}`}
        onClick={(event) => event.stopPropagation()}
        className="ml-auto flex size-8 items-center justify-center rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
      >
        <ChevronDownIcon className="size-3 -rotate-90" aria-hidden="true" />
      </Link>
    ),
  },
];

export const RecentActivities = ({
  showFilter = false,
  className,
}: {
  /** Advanced mode shows an "All" filter control in the header. */
  showFilter?: boolean;
  className?: string;
}) => {
  const { data, isPending, isError } = useGetUserStates();
  const { isSmallViewport } = useScreenSize();
  const navigate = useNavigate();
  const activities = data?.results.slice(1, 5) ?? [];
  return (
    <section
      className={cn(
        // Phones: edge to edge, as tall as its rows; wider screens match the
        // hero's height.
        "-mx-4 flex w-auto min-w-0 flex-col rounded-none bg-frosted-blue px-5 py-5 sm:mx-0 sm:w-full sm:min-h-[410px] sm:rounded-xl md:p-5",
        className,
      )}
    >
      <div className="mb-2 flex items-center justify-between sm:mb-4">
        <h2 className="text-sm font-semibold text-dark">Mapping History</h2>
        {isSmallViewport && (
          <Link
            to={APPLICATION_ROUTES.PROFILE_MAPPING_HISTORY}
            className="flex items-center gap-x-2 text-sm text-dark"
          >
            View All
            <ChevronDownIcon className="size-3 -rotate-90" aria-hidden="true" />
          </Link>
        )}
        {showFilter && (
          <button
            type="button"
            disabled
            className="flex items-center gap-x-1 rounded-md border border-gray-border px-2.5 py-1 text-body-4 text-grey"
          >
            All
            <ChevronDownIcon className="size-3" />
          </button>
        )}
      </div>
      {isPending ? (
        <div
          role="status"
          aria-label="Loading activities"
          className="max-w-full overflow-hidden"
        >
          <span className="sr-only">Loading activities…</span>
          <div aria-hidden="true">
            <TableSkeleton rows={5} columns={3} />
          </div>
        </div>
      ) : isError ? (
        <p role="alert" className="py-4 text-sm text-grey">
          Couldn't load history.
        </p>
      ) : activities.length && isSmallViewport ? (
        <MappingHistoryList
          activities={activities}
          className="[&_a]:px-0 [&_a]:hover:bg-transparent"
        />
      ) : activities.length ? (
        <div className="min-w-0 max-w-full [&_table]:table-fixed [&_tbody_tr]:cursor-pointer [&_td]:p-2.5 [&_td]:text-[13px] [&_td]:font-medium [&_td]:text-[#404446] [&_th]:h-9 [&_th]:p-2.5 [&_th]:text-[12px] [&_th]:font-normal [&_th]:text-[#404446] [&_th:last-child]:w-[52px] [&_th:nth-child(2)]:w-[34%]">
          <DataTable
            columns={columns}
            data={activities}
            onRowClick={(item) => navigate(getProjectPath(item))}
          />
        </div>
      ) : (
        <OverviewEmptyState
          message={
            data?.results.length
              ? "No other activities yet"
              : "No activities yet"
          }
          className="flex-1"
        />
      )}
    </section>
  );
};
