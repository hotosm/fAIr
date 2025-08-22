import { Button } from "@/components/ui/button";
import { SEARCH_PARAMS } from "@/utils/search-params";
import { TQueryParams } from "@/types";
import { ButtonVariant } from "@/enums";

export const ClearFilters = ({
  query,
  clearAllFilters,
  isMobile,
}: {
  clearAllFilters: (event: React.MouseEvent<HTMLButtonElement>) => void;
  query: TQueryParams;
  isMobile?: boolean;
}) => {
  const canClearAllFilters = Boolean(
    query[SEARCH_PARAMS.searchQuery] ||
      query[SEARCH_PARAMS.startDate] ||
      query[SEARCH_PARAMS.endDate] ||
      query[SEARCH_PARAMS.id]
  );

  return (
    <div
      className={`w-fit ${isMobile === true ? "block md:hidden" : isMobile === false ? "hidden md:block" : "block"}`}
    >
      {canClearAllFilters ? (
        <Button
          variant={ButtonVariant.TERTIARY}
          size="medium"
          onClick={clearAllFilters}
        >
          Clear filters
        </Button>
      ) : null}
    </div>
  );
};
