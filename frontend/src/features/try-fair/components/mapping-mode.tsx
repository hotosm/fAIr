import { useState } from "react";
import { ChevronDownIcon } from "@/components/ui/icons";
import { AdvanceIcon } from "@/components/ui/icons/advance-icon";
import { ModeIcon } from "@/components/ui/icons/mode-icon";
import { FeatureCheckIcon } from "@/components/ui/icons/feature-check-icon";
import { DropDown } from "@/components/ui/dropdown";
import { DropdownPlacement } from "@/enums";
import type { DropdownMenuItem } from "@/components/ui/dropdown/dropdown";

const MODES = {
  basic: { label: "Basic", Icon: ModeIcon },
  advanced: { label: "Advanced", Icon: AdvanceIcon },
} as const;

type ModeKey = keyof typeof MODES;

const MappingMode = () => {
  const [mode, setMode] = useState<ModeKey>("basic");
  const CurrentIcon = MODES[mode].Icon;

  const menuItems: DropdownMenuItem[] = Object.entries(MODES).map(
    ([key, { label, Icon }]) => ({
      value: key,
      label,
      Icon,
      onClick: () => setMode(key as ModeKey),
      ...(key === mode ? { SuffixIcon: FeatureCheckIcon } : {}),
    }),
  );

  return (
    <DropDown
      placement={DropdownPlacement.BOTTOM_START}
      disableCheveronIcon
      menuItems={menuItems}

      triggerComponent={
        <div className="bg-light-gray cursor-pointer w-[162px] rounded-[55px] py-2 justify-between px-2 items-center flex gap-8">
          <div className="gap-2 items-center flex ">
            <CurrentIcon />
            <p className="text-dark">{MODES[mode].label}</p>
          </div>
          <ChevronDownIcon className="text-dark size-4" />
        </div>
      }
    />
  );
};

export default MappingMode;
