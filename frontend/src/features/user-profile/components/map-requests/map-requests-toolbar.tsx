import { ChevronDownIcon } from "@/components/ui/icons";
import { DropDown } from "@/components/ui/dropdown";
import { PAGE_LIMIT } from "@/components/shared/pagination";
import { ORDERING_FIELDS } from "@/components/shared/filters/ordering-filter";
import { DropdownPlacement } from "@/enums";
import { useDropdownMenu } from "@/hooks/use-dropdown-menu";
import { TQueryParams } from "@/types";
import { SEARCH_PARAMS } from "@/utils/search-params";
import { cn } from "@/utils";

type MapRequestsToolbarProps = {
  count: number;
  query: TQueryParams;
  updateQuery: (params: TQueryParams) => void;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  disabled?: boolean;
};

const Chevron = ({ className }: { className?: string }) => (
  <ChevronDownIcon className={cn("size-3", className)} />
);

export const MapRequestsToolbar = ({
  count,
  query,
  updateQuery,
  hasNextPage,
  hasPrevPage,
  disabled = false,
}: MapRequestsToolbarProps) => {
  const { onDropdownHide, dropdownRef } = useDropdownMenu();

  const offset = Number(query[SEARCH_PARAMS.offset] ?? 0);
  const currentOrdering = query[SEARCH_PARAMS.ordering] as string | undefined;
  const activeSort = ORDERING_FIELDS.find(
    (field) => field.apiValue === currentOrdering,
  );

  const rangeStart = count === 0 ? 0 : offset + 1;
  const rangeEnd = Math.min(offset + PAGE_LIMIT, count);

  const goToPage = (nextOffset: number) =>
    updateQuery({ [SEARCH_PARAMS.offset]: Math.max(0, nextOffset) });

  return (
    <div className="flex flex-col gap-y-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-body-3 font-semibold text-dark">
        {count} Map Request{count === 1 ? "" : "s"}
      </p>

      <div className="flex items-center gap-x-5">
        {/* Sort by */}
        <DropDown
          ref={dropdownRef}
          placement={DropdownPlacement.BOTTOM_END}
          disableCheveronIcon
          disabled={disabled}
          triggerComponent={
            <div className="flex cursor-pointer items-center gap-x-1.5 text-body-3 text-grey">
              {activeSort ? activeSort.value : "Sort by"}
              <Chevron className="text-grey" />
            </div>
          }
        >
          <div className="w-[180px] rounded-lg bg-white p-1 shadow-lg">
            {ORDERING_FIELDS.map((field) => (
              <button
                key={field.apiValue}
                type="button"
                onClick={() => {
                  updateQuery({
                    [SEARCH_PARAMS.ordering]: field.apiValue as string,
                    [SEARCH_PARAMS.offset]: 0,
                  });
                  onDropdownHide();
                }}
                className={cn(
                  "w-full rounded-md px-3 py-2 text-left text-body-3 hover:bg-off-white",
                  field.apiValue === currentOrdering
                    ? "text-primary font-medium"
                    : "text-dark",
                )}
              >
                {field.value}
              </button>
            ))}
          </div>
        </DropDown>

        {/* Pagination */}
        <div className="flex items-center gap-x-2 text-body-3 text-grey">
          <span className="whitespace-nowrap">
            {rangeStart}-{rangeEnd} of {count}
          </span>
          <button
            type="button"
            aria-label="Previous page"
            disabled={!hasPrevPage || disabled}
            onClick={() => goToPage(offset - PAGE_LIMIT)}
            className="p-1 text-dark disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Chevron className="rotate-90" />
          </button>
          <button
            type="button"
            aria-label="Next page"
            disabled={!hasNextPage || disabled}
            onClick={() => goToPage(offset + PAGE_LIMIT)}
            className="p-1 text-dark disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Chevron className="-rotate-90" />
          </button>
        </div>
      </div>
    </div>
  );
};
