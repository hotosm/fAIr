import { Input } from "@/components/ui/form";
import { CategoryIcon, ListIcon, SearchIcon } from "@/components/ui/icons";
import { DropDown } from "@/components/ui/dropdown";
import { ChevronDownIcon } from "@/components/ui/icons";
import { LayoutView, SHOELACE_SIZES } from "@/enums";
import { ClearFilters, PAGE_LIMIT } from "@/components/shared";
import { ORDERING_OPTIONS } from "@/features/ai-predictions/hooks/use-ai-predictions";
import { ToolTip } from "@/components/ui/tooltip";
import ShowMapToggle from "@/components/shared/show-map-toggle";
import { SEARCH_PARAMS } from "@/utils/search-params";
import { TQueryParams } from "@/types";

type AIPredictionsFiltersProps = {
  search: string;
  onSearchChange: (value: string) => void;
  ordering: string;
  onOrderingChange: (value: string) => void;
  layout?: string;
  onLayoutChange: (value: string) => void;
  totalCount: number;
  offset: number;
  query: TQueryParams;
  hasNextPage: boolean;
  clearAllFilters: () => void;
  hasPrevPage: boolean;
  onMapViewChange: (value: boolean) => void;
  onNextPage: () => void;
  onPrevPage: () => void;
  mapViewIsActive: boolean;
  isPlaceholderData: boolean;
};

export const AIPredictionsFilters = ({
  search,
  onSearchChange,
  ordering,
  onOrderingChange,
  totalCount,
  offset,
  hasNextPage,
  hasPrevPage,
  clearAllFilters,
  onNextPage,
  layout,
  onLayoutChange,
  onPrevPage,
  isPlaceholderData,
  onMapViewChange,
  mapViewIsActive,
  query,
}: AIPredictionsFiltersProps) => {
  const orderingMenuItems = ORDERING_OPTIONS.map((opt) => ({
    value: opt.label,
    apiValue: opt.value,
  }));
  const isGridView = layout === LayoutView.GRID;

  const selectedOrderingLabel =
    ORDERING_OPTIONS.find((o) => o.value === ordering)?.label ?? "Sort by";
  const mapToggleQuery: TQueryParams = {
    [SEARCH_PARAMS.layout]: layout,
    [SEARCH_PARAMS.mapIsActive]: mapViewIsActive,
  };
  const endIndex = offset + PAGE_LIMIT < totalCount ? offset + PAGE_LIMIT : totalCount;

  return (
    <div className="space-y-4">
      {/* Search bar row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center border border-gray-border w-full sm:max-w-xs">
          <SearchIcon className="ml-2 icon-lg text-dark" />
          <Input
            handleInput={(e: React.ChangeEvent<HTMLInputElement>) => onSearchChange(e.target.value)}
            value={search}
            placeholder="Search"
            className="w-full outline-none border-none focus:outline-none focus:ring-0"
            size={SHOELACE_SIZES.MEDIUM}
            disableOutline
          />
        </div>
        <ClearFilters query={query} clearAllFilters={clearAllFilters} />
      </div>

      {/* Count, sort, pagination, layout row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <p className="text-body-3 font-semibold text-nowrap">
          {totalCount} Prediction{totalCount !== 1 ? "s" : ""}
        </p>

        <div className="w-full sm:w-auto flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-x-4">
          <div className="flex items-center justify-between w-full sm:w-auto sm:justify-start sm:gap-x-4">
            {/* Sort */}
            <DropDown
              menuItems={orderingMenuItems}
              handleMenuSelection={(selectedLabel: string) => {
                const opt = ORDERING_OPTIONS.find((o) => o.label === selectedLabel);
                if (opt) onOrderingChange(opt.value);
              }}
              withCheckbox
              defaultSelectedItem={selectedOrderingLabel}
              triggerComponent={
                <p className="text-xs md:text-sm text-dark text-nowrap cursor-pointer">Sort by</p>
              }
            />

            <div className="flex items-center gap-x-3 shrink-0">
              <ShowMapToggle
                query={mapToggleQuery}
                updateQuery={(params) => {
                  onMapViewChange(Boolean(params[SEARCH_PARAMS.mapIsActive]));
                }}
              />

              {/* Layout toggle */}
              <ToolTip content={`Show as ${isGridView ? LayoutView.LIST : LayoutView.GRID}`}>
                <button
                  className="border border-gray-border p-2 items-center flex justify-center text-dark cursor-pointer"
                  disabled={mapViewIsActive}
                  onClick={() => onLayoutChange(isGridView ? LayoutView.LIST : LayoutView.GRID)}
                >
                  {isGridView ? <ListIcon className="icon" /> : <CategoryIcon className="icon" />}
                </button>
              </ToolTip>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex items-center md:justify-end gap-x-2">
            <p className="text-body-4 text-nowrap">
              <span className="font-semibold">
                {totalCount > 0 ? offset + 1 : 0}-{endIndex}
              </span>{" "}
              of {totalCount}
            </p>
            <button
              className="w-4 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              title="Previous"
              disabled={!hasPrevPage}
              onClick={onPrevPage}
            >
              <ChevronDownIcon
                className={`rotate-90 ${hasPrevPage ? "text-dark" : "text-light-gray"}`}
              />
            </button>
            <button
              className="w-4 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              title="Next"
              disabled={!hasNextPage || isPlaceholderData}
              onClick={onNextPage}
            >
              <ChevronDownIcon
                className={`-rotate-90 ${hasNextPage ? "text-dark" : "text-light-gray"}`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
