import { SEARCH_PARAMS } from "@/app/routes/models/models-list";
import { Input } from "@/components/ui/form";
import { SearchIcon } from "@/components/ui/icons";
import { SHOELACE_SIZES } from "@/enums";
import { TQueryParams } from "@/types";
import { APP_CONTENT } from "@/utils";
import { useCallback } from "react";

type SearchFilterProps = {
  query: TQueryParams;
  updateQuery: (param: any) => void;
};

const SearchFilter: React.FC<SearchFilterProps> = ({ updateQuery, query }) => {
  const onSearchInput = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      updateQuery({
        [SEARCH_PARAMS.searchQuery]: value,
      });
    },
    [],
  );

  return (
    <div className={`flex max-w-[60%] items-center border border-gray-border`}>
      <SearchIcon className={`ml-2 icon-lg text-dark`} />
      <Input
        handleInput={onSearchInput}
        value={query[SEARCH_PARAMS.searchQuery] as string}
        placeholder={
          APP_CONTENT.models.modelsList.filtersSection.searchPlaceHolder
        }
        className="w-[80%]"
        size={SHOELACE_SIZES.MEDIUM}
      />
    </div>
  );
};

export default SearchFilter;
