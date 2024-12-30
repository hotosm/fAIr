import { APPLICATION_ROUTES } from '@/constants';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { DialogProps, TQueryParams } from '@/types';
import { useLocation } from 'react-router-dom';

import {
  CategoryFilter,
  DateRangeFilter,
  OrderingFilter,
  StatusFilter,
} from "@/features/models/components/filters";

type TrainingAreaDrawerProps = DialogProps & {
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

const MobileModelFiltersDialog: React.FC<TrainingAreaDrawerProps> = ({
  isOpened,
  closeDialog,
  query,
  updateQuery,
  disabled,
}) => {
  const currentRoute = useLocation();
  const userIsInAccountModelsPage = currentRoute.pathname.includes(
    APPLICATION_ROUTES.ACCOUNT_MODELS,
  );

  return (
    <Dialog isOpened={isOpened} closeDialog={closeDialog} label={"Filter"}>
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

        {userIsInAccountModelsPage && (
          <FilterItem title="Filter by">
            <StatusFilter
              disabled={false}
              isMobileFilterModal
              query={query}
              updateQuery={updateQuery}
            />
          </FilterItem>
        )}

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
