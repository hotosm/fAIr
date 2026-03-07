import {
  SearchIcon,
  CategoryIcon,
  ListIcon,
  FilterIcon,
} from "@/components/ui/icons";
import { DropDown } from "@/components/ui/dropdown";
import { ToolTip } from "@/components/ui/tooltip";
import { TASK_CATEGORIES, DATE_SORT_OPTIONS } from "@/utils/base-model-data";
import { LayoutView } from "@/enums";

type TMenuItem = {
  value: string;
  apiValue: string;
};

type BaseModelsFiltersProps = {
  search: string;
  setSearch: (value: string | null) => void;
  categoryMenuItems: TMenuItem[];
  dateMenuItems: TMenuItem[];
  selectedCategoryLabel: string;
  selectedDateLabel: string;
  setCategory: (value: string | null) => void;
  setDateSort: (value: string | null) => void;
  filteredModelsCount: number;
  layout: string;
  onToggleLayout: () => void;
  onOpenMobileFilters: () => void;
};

const BaseModelsFilters: React.FC<BaseModelsFiltersProps> = ({
  search,
  setSearch,
  categoryMenuItems,
  dateMenuItems,
  selectedCategoryLabel,
  selectedDateLabel,
  setCategory,
  setDateSort,
  filteredModelsCount,
  layout,
  onToggleLayout,
  onOpenMobileFilters,
}) => {
  const isListView = layout === LayoutView.LIST;

  return (
    <div className="sticky top-0 bg-white z-10 py-1">
      <div className="flex flex-col gap-y-1">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-x-4 gap-y-2 flex-wrap">
            {/* Search */}
            <div className="flex max-w-[250px] items-center border border-gray-border">
              <SearchIcon className="ml-2 icon-lg text-dark" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value || null)}
                placeholder="Search"
                className="w-full p-2 outline-none border-none text-body-2base"
              />
            </div>

            {/* Category Filter — Desktop */}
            <div className="hidden md:block border border-gray-border py-2 px-4">
              <DropDown
                menuItems={categoryMenuItems}
                withCheckbox
                handleMenuSelection={(value: string) => {
                  const selected = TASK_CATEGORIES.find(
                    (c) => c.label === value,
                  );
                  if (selected) {
                    setCategory(
                      selected.value === "all" ? null : selected.value,
                    );
                  }
                }}
                defaultSelectedItem={selectedCategoryLabel}
                triggerComponent={
                  <p className="text-sm text-dark text-nowrap">
                    {selectedCategoryLabel}
                  </p>
                }
              />
            </div>

            {/* Date Filter — Desktop */}
            <div className="hidden md:block border border-gray-border py-2 px-4">
              <DropDown
                menuItems={dateMenuItems}
                withCheckbox
                handleMenuSelection={(value: string) => {
                  const selected = DATE_SORT_OPTIONS.find(
                    (d) => d.label === value,
                  );
                  if (selected) {
                    setDateSort(
                      selected.value === "newest" ? null : selected.value,
                    );
                  }
                }}
                defaultSelectedItem={selectedDateLabel}
                triggerComponent={
                  <p className="text-sm text-dark text-nowrap">
                    {selectedDateLabel}
                  </p>
                }
              />
            </div>
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-x-4">
            {/* Mobile filter button */}
            <div
              role="button"
              className="flex md:hidden border border-gray-border p-2 items-center justify-center text-dark cursor-pointer"
              onClick={onOpenMobileFilters}
            >
              <FilterIcon className="icon-lg" />
            </div>
            {/* Desktop layout toggle */}
            <div className="hidden md:flex items-center">
              <ToolTip content={`Show as ${isListView ? "grid" : "list"}`}>
                <button
                  className="border border-gray-border p-2 flex items-center justify-center text-dark cursor-pointer"
                  onClick={onToggleLayout}
                >
                  {isListView ? (
                    <CategoryIcon className="icon-lg" />
                  ) : (
                    <ListIcon className="icon-lg" />
                  )}
                </button>
              </ToolTip>
            </div>
          </div>
        </div>
      </div>

      {/* Model count + mobile controls */}
      <div className="flex items-center justify-between w-full my-4">
        <p className="font-semibold text-body-3">
          {filteredModelsCount} Models
        </p>
        {/* Mobile Layout toggle */}
        <ToolTip content={`Show as ${isListView ? "grid" : "list"}`}>
          <button
            className="flex md:hidden border border-gray-border p-2 items-center justify-center text-dark cursor-pointer"
            onClick={onToggleLayout}
          >
            {isListView ? (
              <CategoryIcon className="icon-lg" />
            ) : (
              <ListIcon className="icon-lg" />
            )}
          </button>
        </ToolTip>
      </div>
    </div>
  );
};

export default BaseModelsFilters;
