import { Button } from "@/components/ui/button";
import { SEARCH_PARAMS } from "@/app/routes/models/models-list";
import { TQueryParams } from "@/types";

const ClearFilters = ({
  query,
  clearAllFilters,
  isMobile,
}: {
  clearAllFilters: (event: React.ChangeEvent<HTMLButtonElement>) => void;
  query: TQueryParams;
  isMobile?: boolean;
}) => {
  const canClearAllFilters = Boolean(
    query[SEARCH_PARAMS.searchQuery] ||
      query[SEARCH_PARAMS.startDate] ||
      query[SEARCH_PARAMS.endDate] ||
      query[SEARCH_PARAMS.id],
  );

  return (
    <div className={`${isMobile ? "block md:hidden" : "hidden md:block"}`}>
      {canClearAllFilters ? (
        // @ts-expect-error bad type definition
        <Button variant="tertiary" size="medium" onClick={clearAllFilters}>
          Clear filters
        </Button>
      ) : null}
    </div>
  );
};

export default ClearFilters;
