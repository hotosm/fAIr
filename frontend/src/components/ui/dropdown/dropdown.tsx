import SlDropdown from "@shoelace-style/shoelace/dist/react/dropdown/index.js";
import SlMenu from "@shoelace-style/shoelace/dist/react/menu/index.js";
import SlMenuItem from "@shoelace-style/shoelace/dist/react/menu-item/index.js";
import SlCheckbox from '@shoelace-style/shoelace/dist/react/checkbox/index.js';
import "./dropdown.css";
import ChevronDownIcon from "../icons/chevron-down";
import { useEffect, useState } from "react";

export type DropdownMenuItem = {
  value: string;
  onClick?: () => void;
  className?: string;
  name?: string;
  disabled?: boolean
  apiValue?: string
};

type DropDownProps = {
  placement?: "bottom-end" | "top-end" | 'bottom-start';
  children?: React.ReactNode;
  onDropdownShow?: () => void;
  onDropdownHide?: () => void;
  menuItems: DropdownMenuItem[];
  dropdownIsOpened: boolean;
  className?: string;
  handleMenuSelection?: (selectedItems?: string[] | any) => void;
  chevronClassName?: string;
  disabled?: boolean;
  withCheckbox?: boolean;
  defaultSelectedItems?: string[];
  defaultSelectedItem?: string;
  menuItemTextSize?: 'default' | 'small'
  multiSelect?: boolean
};

const DropDown: React.FC<DropDownProps> = ({
  children,
  menuItems,
  placement = "bottom-start",
  onDropdownHide,
  onDropdownShow,
  dropdownIsOpened,
  className,
  handleMenuSelection,
  chevronClassName = 'text-[#2C3038]',
  disabled = false,
  withCheckbox = false,
  defaultSelectedItems = [],
  defaultSelectedItem = '',
  multiSelect = false,
  menuItemTextSize = 'default'
}) => {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [selectedItem, setSelectedItem] = useState<string>('');


  useEffect(() => {
    if (defaultSelectedItem) {
      setSelectedItem(defaultSelectedItem);
    }
    if (!multiSelect) return
    if (defaultSelectedItems.length) {
      setSelectedItems(defaultSelectedItems);
    }
  }, [defaultSelectedItems, defaultSelectedItem, multiSelect]);

  const handleSelect = (event: any) => {
    if (withCheckbox) {
      const value = event.detail.item.value;
      if (multiSelect) {
        setSelectedItems((prevSelectedItems) => {
          const isSelected = prevSelectedItems.includes(value);
          let updatedSelectedItems;

          if (isSelected) {
            updatedSelectedItems = prevSelectedItems.filter(item => item !== value);
          } else {
            updatedSelectedItems = [...prevSelectedItems, value];
          }
          handleMenuSelection?.(updatedSelectedItems);
          return updatedSelectedItems;
        });
      } else {
        setSelectedItem(value);
        handleMenuSelection?.(value);
      }

    } else {
      handleMenuSelection?.(event)
    }

  };


  return (
    <SlDropdown
      placement={placement}
      onSlShow={onDropdownShow}
      onSlHide={onDropdownHide}
      className={className}
      disabled={disabled}
      distance={10}
      stayOpenOnSelect={withCheckbox} // when selecting a single item, we can close the dropdown after selection.
    >
      <div slot="trigger" className="inline-flex items-center w-full cursor-pointer">
        {children}
        <ChevronDownIcon
          className={`w-3 h-3 ${chevronClassName} ml-2 transition-all ${dropdownIsOpened && "rotate-180"}`}
        />
      </div>

      <SlMenu onSlSelect={handleSelect}>
        {menuItems.map((menuItem, id) => (
          <SlMenuItem
            key={`dropdown-menu-item-${id}`}
            value={menuItem.value}
            className={`${menuItem.className} ${menuItemTextSize}`}
            onClick={menuItem.onClick}
            disabled={menuItem.disabled ?? false}
          >
            {withCheckbox && (
              <SlCheckbox
                slot="prefix"
                size="small"
                checked={!multiSelect ? menuItem.value === selectedItem : selectedItems.includes(menuItem.value)}
              ></SlCheckbox>
            )}
            {menuItem.value}
          </SlMenuItem>
        ))}
      </SlMenu>
    </SlDropdown>
  );
};

export default DropDown;
