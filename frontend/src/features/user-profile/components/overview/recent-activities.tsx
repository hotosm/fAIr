import { ChevronDownIcon } from "@/components/ui/icons";
import { cn } from "@/utils";
import { OverviewEmptyState } from "./overview-empty-state";
import { useGetUserStates } from "@/features/user-profile/api/user-state";

export const RecentActivities = ({
  showFilter = false,
  className,
}: {
  /** Advanced mode shows an "All" filter control in the header. */
  showFilter?: boolean;
  className?: string;
}) => {
  const { data } = useGetUserStates()
  console.log(data)
  return (
    <section
      className={cn(
        "flex min-w-0 flex-col w-full rounded-md bg-frosted-blue p-4 sm:p-6",
        className,
      )}
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-dark">Recent Activities</h2>
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
      <div>
        {data?.results?.map((item) => (
          <div key={item.state.prediction_id} className="mb-2 w-full justify-between flex">
            <p className="text-sm capitalize text-ink">{item.state.name}</p>
            <p className="text-sm capitalize text-ink">{item.state.type}</p>

            <ChevronDownIcon className="size-3 -rotate-90" />
          </div>
        ))}
      </div>

      {/* <OverviewEmptyState message="No activities yet" className="flex-1" /> */}
    </section>
  );
};
