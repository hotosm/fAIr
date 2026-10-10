import { ChevronDownIcon, MapIcon } from "@/components/ui/icons";
import { APPLICATION_ROUTES } from "@/constants/routes";
import { getFeatureIcon } from "@/features/try-fair/components/model-picker/model-picker-badges";
import { Link, useNavigate } from "react-router-dom";
import { DataTable } from "@/components/ui/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import type { SavedUserState } from "@/features/try-fair/api/user-state";
import { cn } from "@/utils";
import { OverviewEmptyState } from "./overview-empty-state";
import { useGetUserStates } from "@/features/user-profile/api/user-state";
import { TableSkeleton } from "@/features/models/components/skeletons";

const getProjectPath = ({ pid }: SavedUserState) =>
  APPLICATION_ROUTES.TRY_FAIR_PROJECT.replace(":pid", String(pid));

const columns: ColumnDef<SavedUserState>[] = [
  {
    accessorKey: "state.name",
    header: "Name",
    cell: ({ row }) => (
      <span
        className="block max-w-[220px] truncate text-sm"
        title={row.original.state.name}
      >
        {row.original.state.name}
      </span>
    ),
  },
  {
    accessorKey: "state.type",
    header: "Type",
    cell: ({ row }) => {
      const { type, category } = row.original.state;
      const label = category || type;
      const Icon =
        label === "mapping" || label === "prediction"
          ? MapIcon
          : getFeatureIcon(label);
      return (
        <span className="inline-flex min-w-[84px] items-center gap-1.5 whitespace-nowrap rounded bg-grey px-2 py-0.5 text-xs capitalize leading-4 text-white">
          <Icon className="size-3 shrink-0" aria-hidden="true" />
          {label.replace(/[-_]/g, " ")}
        </span>
      );
    },
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
  const navigate = useNavigate();
  return (
    <section
      className={cn(
        "flex min-h-[410px] min-w-0 flex-col w-full rounded-xl bg-frosted-blue p-5",
        className,
      )}
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-dark">Mapping Activities</h2>
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
          Couldn't load mapping activities.
        </p>
      ) : data?.results.length ? (
        <div className="max-w-full overflow-x-auto [&_tbody_tr]:cursor-pointer">
          <DataTable
            columns={columns}
            data={data.results.slice(0, 4)}
            onRowClick={(item) => navigate(getProjectPath(item))}
          />
        </div>
      ) : (
        <OverviewEmptyState message="No activities yet" className="flex-1" />
      )}
    </section>
  );
};
