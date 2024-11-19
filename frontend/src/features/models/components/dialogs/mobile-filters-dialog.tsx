import { Dialog } from "@/components/ui/dialog";

import {
  CategoryFilter,
  DateRangeFilter,
  OrderingFilter,
} from "@/features/models/components/filters";
import { DialogProps, TQueryParams } from "@/types";
import { Button } from "@/components/ui/button";


type TrainingAreaDialogProps = DialogProps & {
  updateQuery: (updatedParams: TQueryParams) => void;
  query: TQueryParams;
  disabled: boolean;
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

const MobileModelFiltersDialog: React.FC<TrainingAreaDialogProps> = ({
  isOpened,
  closeDialog,
  query,
  updateQuery,
  disabled,
}) => {

  return (
    <Dialog
      isOpened={isOpened}
      closeDialog={closeDialog}
      label={"Filter"}

    >
      <div className="flex flex-col gap-y-4">
        <FilterItem title="Sort by">
          <OrderingFilter
            query={query}
            updateQuery={updateQuery}
            isMobileFilterModal
          />
        </FilterItem>
        <FilterItem title="Filter by">
          <CategoryFilter disabled={true} isMobileFilterModal />
        </FilterItem>
        <FilterItem title="">
          <DateRangeFilter
            query={query}
            updateQuery={updateQuery}
            disabled={disabled}
            isMobileFilterModal
          />
        </FilterItem>
        <div className="flex items-center justify-between gap-x-4">
          <Button
            slot="footer"
            variant="default"
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

export default MobileModelFiltersDialog;
