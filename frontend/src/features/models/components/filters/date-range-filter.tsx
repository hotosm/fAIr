
import { SEARCH_PARAMS } from "@/app/routes/models"
import { DropDown } from "@/components/ui/dropdown"
import { DateRangePicker } from "@/components/ui/form"
import { useDropdownMenu } from "@/hooks/use-dropdown-menu"
import { DateFilter, TQueryParams } from "@/types"
import { SlCheckbox } from "@shoelace-style/shoelace/dist/react/index.js"
import { useEffect, useState } from "react"


export const dateFilters: DateFilter[] = [
    {
        label: 'Date Created',
        apiValue: 'created_at',
        searchParams: 'dateCreated'
    },
    {
        label: 'Last Modified',
        apiValue: 'last_modified',
        searchParams: 'lastModified'
    }
]



type DateRangeFilterProps = {
    disabled: boolean
    updateQuery: (newParams: TQueryParams) => void
    query: TQueryParams;
}

const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
    disabled,
    query,
    updateQuery,
}) => {

    const {
        dropdownIsOpened,
        onDropdownHide,
        onDropdownShow
    } = useDropdownMenu();

    const [startDate, setStartDate] = useState<string>(query[SEARCH_PARAMS.startDate] as string);
    const [endDate, setEndDate] = useState<string>(query[SEARCH_PARAMS.endDate] as string);
    const [triggerText, setTriggerText] = useState<string>('Date')

    const onApply = () => {
        updateQuery({
            [SEARCH_PARAMS.startDate]: startDate,
            [SEARCH_PARAMS.endDate]: endDate
        })
        setTriggerText(
            startDate && endDate ? `${startDate} - ${endDate}` :
                startDate ? `${startDate} - Today` :
                    endDate ? `Start - ${endDate}` :
                        'Date'
        );
        onDropdownHide()
    }

    useEffect(() => {
        setStartDate(query[SEARCH_PARAMS.startDate] as string || '');
        setEndDate(query[SEARCH_PARAMS.endDate] as string || '');
        setTriggerText(
            query[SEARCH_PARAMS.startDate] || query[SEARCH_PARAMS.endDate] ?
                `${query[SEARCH_PARAMS.startDate] || 'Start'} - ${query[SEARCH_PARAMS.endDate] || 'Today'}` :
                'Date'
        );
    }, [query[SEARCH_PARAMS.startDate], query[SEARCH_PARAMS.endDate]]);


    const onClear = () => {
        setStartDate('');
        setEndDate('');
        updateQuery({
            [SEARCH_PARAMS.startDate]: '',
            [SEARCH_PARAMS.endDate]: ''
        })
    }

    return (
        <div className="border border-gray-border py-2 px-4 hidden md:block">
            <DropDown
                dropdownIsOpened={dropdownIsOpened}
                onDropdownHide={onDropdownHide}
                onDropdownShow={onDropdownShow}
                disabled={disabled}
                triggerComponent={<p className="text-sm text-dark text-nowrap">{triggerText}</p>}
            >
                <div className="flex flex-col gap-y-4 w-full p-4 bg-white">
                    {/* The user can only select one at a time*/}
                    <div className="flex items-center gap-x-6 justify-start w-full">
                        {
                            dateFilters.map((datefilter, id) =>
                                <SlCheckbox
                                    key={`date-filter-${id}`}
                                    size="small"
                                    checked={query[SEARCH_PARAMS.dateFilter] === datefilter.searchParams}
                                    onSlChange={() => updateQuery({
                                        [SEARCH_PARAMS.dateFilter]: datefilter.searchParams
                                    })}
                                >
                                    {datefilter.label}
                                </SlCheckbox>
                            )
                        }
                    </div>

                    <DateRangePicker
                        onStartDateChange={(e) => setStartDate(e.target.value)}
                        onEndDateChange={(e) => setEndDate(e.target.value)}
                        startDate={startDate}
                        endDate={endDate}
                        onClear={onClear}
                        onApply={onApply}
                    />
                </div>
            </DropDown>
        </div>
    )
}


export default DateRangeFilter;