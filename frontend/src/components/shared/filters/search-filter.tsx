import { Input } from "@/components/ui/form";
import { SearchIcon } from "@/components/ui/icons";
import { SHOELACE_SIZES } from "@/enums";
import { TQueryParams } from "@/types";
import { SEARCH_PARAMS } from "@/utils/search-params";
import { useCallback } from "react";

type SearchFilterProps = {
  query: TQueryParams;
  updateQuery: (param: TQueryParams) => void;
  placeholder: string;
  className?: string;
};

export const SearchFilter: React.FC<SearchFilterProps> = ({
  updateQuery,
  query,
  placeholder,
  className,
}) => {
  const onSearchInput = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      updateQuery({
        [SEARCH_PARAMS.searchQuery]: value,
      });
    },
    []
  );

  return (
    <div
      className={`flex max-w-[60%] items-center border border-gray-border ${className}`}
    >
      <SearchIcon className={`icon-lg ml-2 text-dark`} />
      <Input
        handleInput={onSearchInput}
        value={query[SEARCH_PARAMS.searchQuery] as string}
        placeholder={placeholder}
        className="w-4/5 border-none outline-none focus:outline-none focus:ring-0"
        size={SHOELACE_SIZES.MEDIUM}
        disableOutline
      />
    </div>
  );
};
