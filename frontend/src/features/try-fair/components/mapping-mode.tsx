import { APP_TOUR_IDS } from "@/constants/site-tour";
import { ChevronDownIcon } from "@/components/ui/icons";
import { AdvanceIcon } from "@/components/ui/icons/advance-icon";
import { ModeIcon } from "@/components/ui/icons/mode-icon";
import { FeatureCheckIcon } from "@/components/ui/icons/feature-check-icon";
import { DropDown } from "@/components/ui/dropdown";
import { DropdownPlacement } from "@/enums";
import { useDropdownMenu } from "@/hooks/use-dropdown-menu";
import { useAuth } from "@/app/providers/auth-provider";
import {
  useTryFairParams,
  type MappingModeType,
} from "@/features/try-fair/hooks/use-try-fair-params";

const MODES = {
  basic: { label: "Basic", Icon: ModeIcon },
  advanced: { label: "Advanced", Icon: AdvanceIcon },
} as const;

type ModeKey = keyof typeof MODES;

const MappingMode = () => {
  const { mappingMode, setMappingMode } = useTryFairParams();
  const { isAuthenticated } = useAuth();
  const mode: ModeKey = isAuthenticated ? mappingMode : "basic";
  const CurrentIcon = MODES[mode].Icon;
  const { onDropdownHide, dropdownRef } = useDropdownMenu();
  const availableModes = isAuthenticated ? MODES : { basic: MODES.basic };

  return (
    <DropDown
      ref={dropdownRef}
      placement={DropdownPlacement.BOTTOM_START}
      disableCheveronIcon
      triggerComponent={
        <div
          id={APP_TOUR_IDS.TRY_FAIR_MAPPING_MODE}
          className="bg-light-gray cursor-pointer w-[155px] rounded-[55px] py-2 justify-between px-2 items-center flex gap-2"
        >
          <div className="gap-2 items-center flex ">
            <CurrentIcon />
            <p className="text-dark texts-xs">{MODES[mode].label}</p>
          </div>
          <ChevronDownIcon className="text-dark h-2 w-4 shrink-0" />
        </div>
      }
    >
      <div className="bg-white rounded-lg p-1 w-[155px]">
        {Object.entries(availableModes).map(([key, { label, Icon }]) => {
          const isSelected = key === mode;
          return (
            <button
              key={key}
              type="button"
              onClick={() => {
                setMappingMode(key as MappingModeType);
                onDropdownHide();
              }}
              className="w-full flex items-center justify-between gap-2 px-2 py-2 rounded-md hover:bg-light-gray transition-colors"
            >
              <div className="flex items-center gap-2">
                <Icon className="size-5" />
                <span className="text-dark text-xs">{label}</span>
              </div>
              {isSelected && <FeatureCheckIcon className="size-4" />}
            </button>
          );
        })}
      </div>
    </DropDown>
  );
};

export default MappingMode;
