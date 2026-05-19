import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { DropDown } from "@/components/ui/dropdown";
import { ButtonVariant } from "@/enums";
import { DATE_SORT_OPTIONS } from "@/features/base-models/utils/common";

type TMenuItem = {
  value: string;
  apiValue: string;
};

type MobileBaseModelFiltersDialogProps = {
  isOpened: boolean;
  closeDialog: () => void;
  categoryMenuItems: TMenuItem[];
  dateMenuItems: TMenuItem[];
  selectedCategoryLabel: string;
  selectedDateLabel: string;
  setCategory: (value: string | null) => void;
  setDateSort: (value: string | null) => void;
};

const FilterItem = ({
  children,
  title,
}: {
  title: string;
  children: React.ReactNode;
}) => {
  return (
    <div>
      <p className="mb-2">{title}</p>
      <div className="border border-gray-border p-4">{children}</div>
    </div>
  );
};

const MobileBaseModelFiltersDialog: React.FC<
  MobileBaseModelFiltersDialogProps
> = ({
  isOpened,
  closeDialog,
  categoryMenuItems,
  dateMenuItems,
  selectedCategoryLabel,
  selectedDateLabel,
  setCategory,
  setDateSort,
}) => {
  return (
    <Dialog isOpened={isOpened} closeDialog={closeDialog} label={"Filter"}>
      <div className="flex flex-col gap-y-4">
        {/* Sort */}
        <FilterItem title="Sort by">
          <DropDown
            menuItems={dateMenuItems}
            withCheckbox
            handleMenuSelection={(value: string) => {
              const selected = DATE_SORT_OPTIONS.find((d) => d.label === value);

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
        </FilterItem>

        {/* Category */}
        <FilterItem title="Filter by Category">
          <DropDown
            menuItems={categoryMenuItems}
            withCheckbox
            handleMenuSelection={(value: string) => {
              const selected = categoryMenuItems.find((c) => c.value === value);

              if (selected) {
                setCategory(
                  selected.apiValue === "all" ? null : selected.apiValue,
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
        </FilterItem>

        {/* Footer */}
        <div className="flex items-center justify-between gap-x-4">
          <Button
            slot="footer"
            variant={ButtonVariant.DEFAULT}
            onClick={closeDialog}
            size="medium"
          >
            Close
          </Button>
        </div>
      </div>
    </Dialog>
  );
};

export default MobileBaseModelFiltersDialog;
