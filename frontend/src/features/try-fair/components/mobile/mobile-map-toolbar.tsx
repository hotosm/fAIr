import { useState } from "react";
import { DropDown } from "@/components/ui/dropdown";
import {
  ChevronDownIcon,
  CloudDownloadIcon,
  LoopIcon,
  MapIcon,
} from "@/components/ui/icons";
import { HistoryIcon } from "@/components/ui/icons/refresh-icon";
import { ShareIcon } from "@/components/ui/icons/share-icon";
import { DropdownPlacement } from "@/enums";
import MappingMode from "@/features/try-fair/components/mapping-mode";
import { useTryFairActions } from "@/features/try-fair/hooks/use-try-fair-actions";
import { useDropdownMenu } from "@/hooks/use-dropdown-menu";
import type { IconProps } from "@/types";
import { cn } from "@/utils";

type MenuAction = {
  label: string;
  Icon: React.FC<IconProps>;
  onClick: () => void;
  disabled?: boolean;
};

/**
 * Floating chips at the top of the map on phones: the Basic/Advanced mode
 * switch and a "Menu" with the actions the desktop header shows as buttons.
 */
export const MobileMapToolbar = () => {
  const {
    hasPredictions,
    downloadResults,
    mapLargeArea,
    changeImagery,
    share,
    togglePredictionHistory,
  } = useTryFairActions();
  const { dropdownRef, onDropdownHide } = useDropdownMenu();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const actions: MenuAction[] = [
    { label: "Map Large Area", Icon: MapIcon, onClick: mapLargeArea },
    { label: "Change Imagery", Icon: LoopIcon, onClick: changeImagery },
    {
      label: "Download Result",
      Icon: CloudDownloadIcon,
      onClick: downloadResults,
      disabled: !hasPredictions,
    },
    { label: "Share", Icon: ShareIcon, onClick: share },
    {
      label: "Prediction History",
      Icon: HistoryIcon,
      onClick: togglePredictionHistory,
    },
  ];

  return (
    <div className="absolute left-3 top-3 z-10 flex items-center gap-2">
      <MappingMode tourTarget={false} variant="chip" />

      <DropDown
        ref={dropdownRef}
        placement={DropdownPlacement.BOTTOM_START}
        disableCheveronIcon
        onDropdownShow={() => setIsMenuOpen(true)}
        onDropdownHide={() => setIsMenuOpen(false)}
        triggerComponent={
          <span className="flex h-9 items-center gap-2 rounded-full bg-white px-3 text-sm text-dark shadow-md">
            Menu
            <ChevronDownIcon
              className={cn(
                "h-2 w-3 transition-transform",
                isMenuOpen && "rotate-180",
              )}
            />
          </span>
        }
      >
        <ul className="min-w-[190px] rounded-lg bg-white p-1">
          {actions.map(({ label, Icon, onClick, disabled }) => (
            <li key={label}>
              <button
                type="button"
                disabled={disabled}
                onClick={() => {
                  onDropdownHide();
                  onClick();
                }}
                className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm text-dark hover:bg-light-gray disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Icon className="size-4 shrink-0" />
                {label}
              </button>
            </li>
          ))}
        </ul>
      </DropDown>
    </div>
  );
};
