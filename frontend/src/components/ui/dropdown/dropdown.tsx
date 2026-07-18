import { ChevronDownIcon } from "@/components/ui/icons";
import { Divider } from "@/components/ui/divider";
import { cn } from "@/utils";
import { DropdownPlacement } from "@/enums";
import { SlCheckbox } from "@shoelace-style/shoelace/dist/react";
import { SlDropdown } from "@shoelace-style/shoelace/dist/react";
import { SlMenu } from "@shoelace-style/shoelace/dist/react";
import { SlMenuItem } from "@shoelace-style/shoelace/dist/react";

import {
  forwardRef,
  Fragment,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import "./dropdown.css";
import { SlDropdownType } from "@/types";

type TDropdownMenuItem = {
  value: string;
  /** Optional human-readable label. Falls back to `value` if omitted. */
  label?: string;
  onClick?: (e: any | undefined) => void;
  className?: string;
  name?: string;
  disabled?: boolean;
  apiValue?: string | number;
  /** Render a divider line above this item */
  dividerBefore?: boolean;
  /** SVG React component icon */
  Icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  /** Image URL icon (e.g. imported SVG asset) */
  imgSrc?: string;
};
export type DropdownMenuItem = TDropdownMenuItem & {
  subMenuItems?: TDropdownMenuItem[];
};

type DropDownProps = {
  placement?: DropdownPlacement;
  children?: React.ReactNode;
  onDropdownShow?: (event: React.MouseEvent<HTMLDivElement>) => void;
  onDropdownHide?: (event: React.MouseEvent<HTMLDivElement>) => void;
  menuItems?: DropdownMenuItem[];
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
  hoist?: boolean;
};

const DropDown = forwardRef<SlDropdownType, DropDownProps>((props, ref) => {
  const {
    children,
    menuItems,
    placement = DropdownPlacement.BOTTOM_START,
    onDropdownHide,
    onDropdownShow,
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
    hoist = false,
  } = props;

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

  const dropdownRef = useRef<SlDropdownType>(null);

  useImperativeHandle(ref, () => dropdownRef.current as SlDropdownType);

  return (
    <SlDropdown
      ref={dropdownRef}
      placement={placement}
      onSlAfterShow={(event: CustomEvent) => {
        if (!disabled && event.target === event.currentTarget) {
          // @ts-expect-error bad type definition
          onDropdownShow?.();
        }
      }}
      onSlAfterHide={(event: CustomEvent) => {
        if (!disabled && event.target === event.currentTarget) {
          // @ts-expect-error bad type definition
          onDropdownHide?.();
        }
      }}
      className={className}
      disabled={disabled}
      distance={distance}
      hoist={hoist}
      stayOpenOnSelect={withCheckbox} // when selecting a single item, we can close the dropdown after selection.
    >
      <div
        slot="trigger"
        className="inline-flex items-center w-full cursor-pointer"
      >
        {triggerComponent}
        {!disableCheveronIcon && (
          <ChevronDownIcon
            className={cn("w-3 h-3 text-dark  ml-2 transition-all")}
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
              <Fragment key={`dropdown-menu-item-${id}`}>
                {menuItem.dividerBefore && <Divider />}
                <SlMenuItem
                  value={menuItem.value}
                  className={cn(`${menuItem.className}`)}
                  onClick={menuItem.onClick}
                  disabled={menuItem.disabled ?? false}
                >
                  {/* Icon prefix: SVG component or image URL */}
                  {(menuItem.Icon || menuItem.imgSrc) && !withCheckbox && (
                    <span
                      slot="prefix"
                      className="flex items-center justify-center size-5"
                    >
                      {menuItem.imgSrc ? (
                        <img
                          src={menuItem.imgSrc}
                          alt={menuItem.label ?? menuItem.value}
                          className="size-5 object-contain"
                        />
                      ) : menuItem.Icon ? (
                        <menuItem.Icon className="size-5" />
                      ) : null}
                    </span>
                  )}
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
                  {menuItem.label ?? menuItem.value}
                  {menuItem?.subMenuItems ? (
                    <SlMenu slot="submenu">
                      {menuItem.subMenuItems?.map((subMenuItem, id) => (
                        <SlMenuItem
                          key={`dropdown-submenu-item-${id}`}
                          value={subMenuItem.value}
                          className={cn(`${subMenuItem.className}`)}
                          onClick={subMenuItem.onClick}
                        >
                          {subMenuItem.label ?? subMenuItem.value}
                        </SlMenuItem>
                      ))}
                    </SlMenu>
                  ) : null}
                </SlMenuItem>
              </Fragment>
            ))}
          </SlMenu>
        ) : (
          children
        )}
      </div>
    </SlDropdown>
  );
});

DropDown.displayName = "DropDown";
export default DropDown;
