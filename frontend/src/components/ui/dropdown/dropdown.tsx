import SlDropdown from "@shoelace-style/shoelace/dist/react/dropdown/index.js";
import SlMenu from "@shoelace-style/shoelace/dist/react/menu/index.js";
import SlMenuItem from "@shoelace-style/shoelace/dist/react/menu-item/index.js";
import SlCheckbox from "@shoelace-style/shoelace/dist/react/checkbox/index.js";
import "./dropdown.css";
import ChevronDownIcon from "../icons/chevron-down-icon";
import { useEffect, useState } from "react";
import { cn } from "@/utils";

export type DropdownMenuItem = {
  value: string;
  onClick?: () => void;
  className?: string;
  name?: string;
  disabled?: boolean;
  apiValue?: string;
};

type DropDownProps = {
  placement?: "bottom-end" | "top-end" | "bottom-start";
  children?: React.ReactNode;
  onDropdownShow?: (event: React.MouseEvent<HTMLDivElement>) => void;
  onDropdownHide?: (event: React.MouseEvent<HTMLDivElement>) => void;
  menuItems?: DropdownMenuItem[];
  dropdownIsOpened: boolean;
  className?: string;
  handleMenuSelection?: (selectedItems?: string[] | any) => void;
  disabled?: boolean;
  withCheckbox?: boolean;
  defaultSelectedItems?: string[];
  defaultSelectedItem?: string;
  menuItemTextSize?: "default" | "small";
  multiSelect?: boolean;
  triggerComponent: React.ReactNode;
  distance?: number;
  disableCheveronIcon?: boolean;
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
  disabled = false,
  withCheckbox = false,
  defaultSelectedItems = [],
  defaultSelectedItem = "",
  multiSelect = false,
  menuItemTextSize = "default",
  triggerComponent,
  distance = 20,
  disableCheveronIcon = false,
}) => {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [selectedItem, setSelectedItem] = useState<string>("");

  useEffect(() => {
    if (defaultSelectedItem) {
      setSelectedItem(defaultSelectedItem);
    }
    if (!multiSelect) return;
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
            updatedSelectedItems = prevSelectedItems.filter(
              (item) => item !== value,
            );
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
      handleMenuSelection?.(event);
    }
  };

  return (
    <SlDropdown
      placement={placement}
      // @ts-expect-error bad type definition
      onSlShow={onDropdownShow}
      // @ts-expect-error bad type definition
      onSlHide={onDropdownHide}
      className={className}
      disabled={disabled}
      distance={distance}
      stayOpenOnSelect={withCheckbox} // when selecting a single item, we can close the dropdown after selection.
    >
      <div
        slot="trigger"
        className="inline-flex items-center w-full cursor-pointer"
      >
        {triggerComponent}
        {!disableCheveronIcon && (
          <ChevronDownIcon
            className={cn(
              `w-3 h-3 text-dark  ml-2 transition-all ${dropdownIsOpened && "rotate-180"}`,
            )}
          />
        )}
      </div>
      <div className="shadow-2xl">
        {menuItems && menuItems.length > 0 ? (
          <SlMenu onSlSelect={handleSelect}>
            {menuItems?.map((menuItem, id) => (
              <SlMenuItem
                key={`dropdown-menu-item-${id}`}
                value={menuItem.value}
                className={cn(`${menuItem.className} ${menuItemTextSize}`)}
                onClick={menuItem.onClick}
                disabled={menuItem.disabled ?? false}
              >
                {withCheckbox && (
                  <SlCheckbox
                    slot="prefix"
                    size="small"
                    checked={
                      !multiSelect
                        ? menuItem.value === selectedItem
                        : selectedItems.includes(menuItem.value)
                    }
                  ></SlCheckbox>
                )}
                {menuItem.value}
              </SlMenuItem>
            ))}
          </SlMenu>
        ) : (
          children
        )}
      </div>
    </SlDropdown>
  );
};

export default DropDown;
