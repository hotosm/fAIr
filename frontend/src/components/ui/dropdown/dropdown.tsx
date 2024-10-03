import SlDropdown from "@shoelace-style/shoelace/dist/react/dropdown/index.js";
import SlMenu from "@shoelace-style/shoelace/dist/react/menu/index.js";
import SlMenuItem from "@shoelace-style/shoelace/dist/react/menu-item/index.js";
import "./dropdown.css";
import ChevronDownIcon from "../icons/chevron-down";

export type DropdownMenuItem = {
  value: string;
  onClick?: () => void;
  className?: string;
  name?: string

}
type DropDownProps = {
  placement?: "bottom-end" | "top-end";
  children?: React.ReactNode;
  onDropdownShow?: () => void;
  onDropdownHide?: () => void;
  menuItems: DropdownMenuItem[];
  dropdownIsOpened: boolean;
  className?: string,
  handleMenuSelection?: (arg: any) => void
  chevronClassName?: string
  disabled?: boolean
};
const DropDown: React.FC<DropDownProps> = ({
  children,
  menuItems,
  placement = "bottom-end",
  onDropdownHide,
  onDropdownShow,
  dropdownIsOpened,
  className,
  handleMenuSelection,
  chevronClassName = 'text-[#2C3038]',
  disabled = false
}) => {
  return (
    <SlDropdown
      placement={placement}
      onSlShow={onDropdownShow}
      onSlHide={onDropdownHide}
      className={className}
      disabled={disabled}
    >
      <div slot="trigger" className="inline-flex items-center w-full cursor-pointer">
        {children}
        <ChevronDownIcon
          className={`w-4 h-4 ${chevronClassName} ml-2 ${dropdownIsOpened && "rotate-180"}`}
        />
      </div>

      <SlMenu onSlSelect={handleMenuSelection}>
        {menuItems.map((menuItem, id) => (
          <SlMenuItem
            key={`dropdown-menu-item-${id}`}
            value={menuItem.value}
            onClick={menuItem.onClick}
            className={menuItem.className}
          >
            {menuItem.value}
          </SlMenuItem>
        ))}
      </SlMenu>
    </SlDropdown>
  );
};

export default DropDown;
