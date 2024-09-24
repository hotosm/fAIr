import SlDropdown from '@shoelace-style/shoelace/dist/react/dropdown/index.js';
import SlMenu from '@shoelace-style/shoelace/dist/react/menu/index.js';
import SlMenuItem from '@shoelace-style/shoelace/dist/react/menu-item/index.js';
import './dropdown.css'

type DropDownProps = {
    placement?: 'bottom-end' | 'top-end'
    children?: React.ReactNode
    onDropdownShow?: () => void
    onDropdownHide?: () => void
    menuItems: {
        value: string
        onClick: () => void
        className?: string
    }[]
}
const DropDown: React.FC<DropDownProps> = ({ children, menuItems, placement = 'bottom-end', onDropdownHide, onDropdownShow }) => {
    return (
        <SlDropdown placement={placement} onSlShow={onDropdownShow} onSlHide={onDropdownHide}>
            {children}
            <SlMenu>
                {
                    menuItems.map((menuItem, id) => <SlMenuItem key={`dropdown-menu-item-${id}`} value={menuItem.value} onClick={menuItem.onClick} className={menuItem.className}>{menuItem.value}</SlMenuItem>)
                }
            </SlMenu>
        </SlDropdown>
    )
}


export default DropDown