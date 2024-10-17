import { SEARCH_PARAMS } from "@/app/routes/models";
import { DropDown } from "@/components/ui/dropdown"
import { DropdownMenuItem } from "@/components/ui/dropdown/dropdown";
import { useDropdownMenu } from "@/hooks/use-dropdown-menu";
import { TQueryParams } from "@/types";



export const ORDERING_FIELDS: DropdownMenuItem[] = [
    {
        value: 'Oldest Created',
        apiValue: 'created_at', // The actual filter from the backend. This is what is used to update the search params.

    },
    {
        value: 'Newest Created',
        apiValue: '-created_at',

    },
    {
        value: 'Oldest Updated',
        apiValue: 'last_modified',

    },
    {
        value: 'Newest Updated',
        apiValue: '-last_modified',

    },
]



type OrderingFilterProps = {
    updateQuery: (params: TQueryParams,) => void
    query: TQueryParams
    disabled?: boolean
}


const OrderingFilter: React.FC<OrderingFilterProps> = ({ disabled = false, query, updateQuery }) => {

    const onSortSelect = (selectedItem: string) => {
        updateQuery({
            [SEARCH_PARAMS.ordering]: ORDERING_FIELDS.find(v => v.value === selectedItem)?.apiValue as string
        })
    };

    const {
        dropdownIsOpened,
        onDropdownHide,
        onDropdownShow
    } = useDropdownMenu();

    return (
        <div className="hidden md:block">
            <DropDown
                menuItems={ORDERING_FIELDS}
                dropdownIsOpened={dropdownIsOpened}
                onDropdownHide={onDropdownHide}
                onDropdownShow={onDropdownShow}
                handleMenuSelection={onSortSelect}
                disabled={disabled}
                withCheckbox
                defaultSelectedItem={ORDERING_FIELDS.find(v => v.apiValue === query[SEARCH_PARAMS.ordering])?.value}
                triggerComponent={<p className="text-sm text-dark text-nowrap">Sort by</p>}
            >
            </DropDown>
        </div>
    )
}

export default OrderingFilter;