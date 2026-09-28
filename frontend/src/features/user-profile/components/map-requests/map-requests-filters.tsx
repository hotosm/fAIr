import { ChevronDownIcon } from "@/components/ui/icons";
import { SearchIcon } from "@/components/ui/icons/search-icon";
import { TQueryParams } from "@/types";
import { SEARCH_PARAMS } from "@/utils/search-params";

/** A styled dropdown-look trigger (Category / Date). Presentational for now —
 *  the requests query only supports search + ordering. */
const FilterPill = ({ label }: { label: string }) => (
  <button
    type="button"
    className="flex items-center gap-x-2 rounded-lg border border-gray-border bg-white px-3.5 py-2.5 text-body-3 text-dark"
  >
    {label}
    <ChevronDownIcon className="size-3 text-grey" />
  </button>
);

export const MapRequestsFilters = ({
  query,
  updateQuery,
}: {
  query: TQueryParams;
  updateQuery: (params: TQueryParams) => void;
}) => {
  const searchValue = (query[SEARCH_PARAMS.searchQuery] as string) ?? "";

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 rounded-lg border border-gray-border bg-white px-3 py-2.5">
        <SearchIcon className="size-4 text-grey" />
        <input
          type="text"
          value={searchValue}
          onChange={(event) =>
            updateQuery({ [SEARCH_PARAMS.searchQuery]: event.target.value })
          }
          placeholder="Search"
          className="w-40 bg-transparent text-body-3 text-dark outline-none placeholder:text-grey sm:w-56"
        />
      </div>

      <FilterPill label="Category" />
      <FilterPill label="Date" />
    </div>
  );
};
