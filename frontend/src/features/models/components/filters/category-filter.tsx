import { DropDown } from "@/components/ui/dropdown"
import { DropdownMenuItem } from "@/components/ui/dropdown/dropdown";
import { useDropdownMenu } from "@/hooks/use-dropdown-menu";





type CategoryFilterProps = {
    disabled: boolean

}
const CategoryFilter: React.FC<CategoryFilterProps> = ({ disabled }) => {

    const categories: DropdownMenuItem[] = [
        {
            value: 'Buildings',
            disabled: true // the endpoint does not support filtering by categories for now, so we'll disable all categories
        },
        {
            value: 'Roads',
            disabled: true
        },
        {
            value: 'Rivers',
            disabled: true
        },
        {
            value: 'Forest',
            disabled: true
        },
        {
            value: 'All',
            disabled: true
        }
    ]

    const {
        dropdownIsOpened,
        onDropdownHide,
        onDropdownShow
    } = useDropdownMenu();

    return (
        <div className="hidden md:block border border-gray-border py-2 px-4">
            <DropDown
                menuItems={categories}
                dropdownIsOpened={dropdownIsOpened}
                onDropdownHide={onDropdownHide}
                onDropdownShow={onDropdownShow}
                handleMenuSelection={() => null}
                disabled={disabled}
                withCheckbox
                defaultSelectedItem={categories[0].value}
                menuItemTextSize="small"
                triggerComponent={<p className="text-sm text-dark text-nowrap">{categories[0].value}</p>}
            >
            </DropDown>
        </div>
    )
}

export default CategoryFilter