import { DropDown } from "@/components/ui/dropdown";
import { Switch } from "@/components/ui/form";
import { FilterIcon, ListIcon, SearchIcon } from "@/components/ui/icons";
import { DATE_SORT_OPTIONS, TASK_CATEGORIES } from "@/features/base-models/data/base-model-data";

type MenuItem = {
  value: string;
  apiValue: string;
};

type BaseModelsFiltersProps = {
  search: string;
  setSearch: (value: string | null) => void;
  categoryMenuItems: MenuItem[];
  dateMenuItems: MenuItem[];
  selectedCategoryLabel: string;
  selectedDateLabel: string;
  setCategory: (value: string | null) => void;
  setDateSort: (value: string | null) => void;
  isMapViewActive: boolean;
  setMapView: (value: string | null) => void;
  filteredModelsCount: number;
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
  isMapViewActive,
  setMapView,
  filteredModelsCount,
}) => {
  return (
    <div className="sticky top-0 bg-white z-10 py-1">
      <div className="flex flex-col gap-y-1">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-x-4 gap-y-2 flex-wrap">
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

            <div className="hidden md:block border border-gray-border py-2 px-4">
              <DropDown
                menuItems={categoryMenuItems}
                withCheckbox
                handleMenuSelection={(value: string) => {
                  const selected = TASK_CATEGORIES.find((c) => c.label === value);
                  if (selected) {
                    setCategory(selected.value === "all" ? null : selected.value);
                  }
                }}
                defaultSelectedItem={selectedCategoryLabel}
                triggerComponent={
                  <p className="text-sm text-dark text-nowrap">{selectedCategoryLabel}</p>
                }
              />
            </div>

            <div className="hidden md:block border border-gray-border py-2 px-4">
              <DropDown
                menuItems={dateMenuItems}
                withCheckbox
                handleMenuSelection={(value: string) => {
                  const selected = DATE_SORT_OPTIONS.find((d) => d.label === value);
                  if (selected) {
                    setDateSort(selected.value === "newest" ? null : selected.value);
                  }
                }}
                defaultSelectedItem={selectedDateLabel}
                triggerComponent={
                  <p className="text-sm text-dark text-nowrap">{selectedDateLabel}</p>
                }
              />
            </div>

            <button className="border md:hidden border-gray-border p-2 flex items-center justify-center text-dark cursor-pointer">
              <ListIcon className="icon-lg" />
            </button>
            <button className="md:hidden border border-gray-border p-2 flex items-center justify-center text-dark cursor-pointer">
              <FilterIcon className="icon-lg" />
            </button>
          </div>

          <div className="md:flex items-center gap-x-10 hidden">
            <div className="inline-flex items-center gap-x-4">
              <p className="text-body-2base text-nowrap">Map View</p>
              <Switch
                checked={isMapViewActive}
                handleSwitchChange={() => {
                  setMapView(isMapViewActive ? null : "true");
                }}
              />
            </div>
            <button className="border border-gray-border p-2 flex items-center justify-center text-dark cursor-pointer">
              <ListIcon className="icon-lg" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between w-full my-4">
        <p className="font-semibold text-body-3">{filteredModelsCount} Models</p>
        <div className="inline-flex md:hidden items-center gap-x-4">
          <p className="text-body-2base text-nowrap">Map View</p>
          <Switch
            checked={isMapViewActive}
            handleSwitchChange={() => {
              setMapView(isMapViewActive ? null : "true");
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default BaseModelsFilters;