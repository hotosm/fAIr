import { SEARCH_PARAMS } from "@/app/routes/models";
import { Input } from "@/components/ui/form";
import { SearchIcon } from "@/components/ui/icons";
import useDebounce from "@/hooks/use-debounce";
import { useCallback, useEffect, useState } from "react";

type SearchFilterProps = {
    query: Record<string, string | number | boolean>;
    updateQuery: (param: any) => void;
    clearAll: boolean
};

const SearchFilter: React.FC<SearchFilterProps> = ({ updateQuery, query, clearAll }) => {

    const [localSearchQuery, setLocalSearchQuery] = useState<string>(query[SEARCH_PARAMS.searchQuery] as string || '');

    const debouncedSearchText = useDebounce(localSearchQuery, 300);

    const onSearchInput = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setLocalSearchQuery(value);
    }, []);


    useEffect(() => {
        setLocalSearchQuery(query[SEARCH_PARAMS.searchQuery] as string || '');
    }, [query[SEARCH_PARAMS.searchQuery]]);

    useEffect(() => {
        if (debouncedSearchText !== query[SEARCH_PARAMS.searchQuery]) {
            updateQuery({
                [SEARCH_PARAMS.searchQuery]: debouncedSearchText,
            });
        }
    }, [debouncedSearchText, query[SEARCH_PARAMS.searchQuery], updateQuery]);


    useEffect(() => {
        updateQuery({
            [SEARCH_PARAMS.searchQuery]: debouncedSearchText,
        });
    }, [debouncedSearchText, updateQuery]);


    useEffect(() => {
        if (clearAll) {
            setLocalSearchQuery('');
            updateQuery({ [SEARCH_PARAMS.searchQuery]: '' });
        }
    }, [clearAll, updateQuery]);

    return (
        <div className="flex items-center md:px-4 border border-gray-border w-full">
            <SearchIcon className="w-6 h-6" />
            <Input
                handleInput={onSearchInput}
                value={localSearchQuery}
                placeholder="Search"
            />
        </div>
    );
};

export default SearchFilter;
