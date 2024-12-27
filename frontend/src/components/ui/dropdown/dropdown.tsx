import { SlDropdown } from "@shoelace-style/shoelace/dist/react";
import { SlMenu } from "@shoelace-style/shoelace/dist/react";
import { SlMenuItem } from "@shoelace-style/shoelace/dist/react";
import { SlCheckbox } from "@shoelace-style/shoelace/dist/react";
import "./dropdown.css";
import { ChevronDownIcon } from "@/components/ui/icons";
import { useEffect, useState } from "react";
import { cn } from "@/utils";
import { DropdownPlacement } from "@/enums";

export type DropdownMenuItem = {
  value: string;
  onClick?: () => void;
  className?: string;
  name?: string;
  disabled?: boolean;
  apiValue?: string | number;
};

type DropDownProps = {
  placement?: DropdownPlacement;
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

  multiSelect?: boolean;
  triggerComponent: React.ReactNode;
  distance?: number;
  disableCheveronIcon?: boolean;
};

const DropDown: React.FC<DropDownProps> = ({
  children,
  menuItems,
  placement = DropdownPlacement.BOTTOM_START,
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
      open={dropdownIsOpened}
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
      <div
        className={cn(
          `shadow-2xl z-[1000000000] map-elements-z-index ${className}`,
        )}
      >
        {menuItems && menuItems.length > 0 ? (
          <SlMenu onSlSelect={handleSelect}>
            {menuItems?.map((menuItem, id) => (
              <SlMenuItem
                key={`dropdown-menu-item-${id}`}
                value={menuItem.value}
                className={cn(`${menuItem.className}`)}
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
