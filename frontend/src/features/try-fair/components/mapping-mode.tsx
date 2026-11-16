import { APP_TOUR_IDS } from "@/constants/site-tour";
import { ChevronDownIcon } from "@/components/ui/icons";
import { AdvanceIcon } from "@/components/ui/icons/advance-icon";
import { ModeIcon } from "@/components/ui/icons/mode-icon";
import { FeatureCheckIcon } from "@/components/ui/icons/feature-check-icon";
import { DropDown } from "@/components/ui/dropdown";
import { ToolTip } from "@/components/ui/tooltip";
import { DropdownPlacement } from "@/enums";
import { useDropdownMenu } from "@/hooks/use-dropdown-menu";
import { useAuth } from "@/app/providers/auth-provider";
import {
  useTryFairParams,
  type MappingModeType,
} from "@/features/try-fair/hooks/use-try-fair-params";
import { cn } from "@/utils";
import { useLocation, useNavigate } from "react-router-dom";
import { APPLICATION_ROUTES } from "@/constants/routes";

// Dashboard pages Basic mode can reach; from any other profile page,
// switching to Basic goes to the Basic dashboard.
const BASIC_PROFILE_PAGES: string[] = [
  APPLICATION_ROUTES.PROFILE_BASE,
  APPLICATION_ROUTES.PROFILE_OFFLINE_PREDICTIONS,
  APPLICATION_ROUTES.PROFILE_MAPPING_HISTORY,
];

const MODES = {
  basic: { label: "Basic", Icon: ModeIcon },
  advanced: { label: "Advanced", Icon: AdvanceIcon },
} as const;

type ModeKey = keyof typeof MODES;

const MappingMode = ({
  tourTarget = true,
  fullWidth = false,
  variant = "pill",
}: {
  tourTarget?: boolean;
  fullWidth?: boolean;
  /** "chip" is the white floating button used on the mobile map. */
  variant?: "pill" | "chip";
}) => {
  const isChip = variant === "chip";
  const { mappingMode, setMappingMode } = useTryFairParams();
  const { isAuthenticated } = useAuth();
  const mode: ModeKey = isAuthenticated ? mappingMode : "basic";
  const CurrentIcon = MODES[mode].Icon;
  const { onDropdownHide, dropdownRef } = useDropdownMenu();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isOtherProfilePage =
    pathname.startsWith(`${APPLICATION_ROUTES.PROFILE_BASE}/`) &&
    !BASIC_PROFILE_PAGES.includes(pathname.replace(/\/+$/, ""));

  const trigger = (
    <div
      id={tourTarget ? APP_TOUR_IDS.TRY_FAIR_MAPPING_MODE : undefined}
      aria-disabled={!isAuthenticated || undefined}
      className={cn(
        "flex h-8 items-center justify-between gap-2 rounded-[55px] px-3",
        isChip ? "h-9 bg-white shadow-md" : "bg-light-gray",
        fullWidth ? "w-full" : isChip ? "w-fit" : "w-[136px]",
        isAuthenticated ? "cursor-pointer" : "cursor-not-allowed",
      )}
    >
      <div className="gap-2 items-center flex ">
        <CurrentIcon className="size-4 shrink-0" />
        <p className={cn("text-dark", isChip ? "text-sm" : "text-xs")}>
          {MODES[mode].label}
        </p>
      </div>
      <ChevronDownIcon
        className={cn(
          "h-2 w-4 shrink-0",
          isAuthenticated ? "text-dark" : "text-gray-disabled",
        )}
      />
    </div>
  );

  // Signed out: shown but disabled; Advanced needs an account.
  if (!isAuthenticated) {
    return <ToolTip content="Log in to use Advanced mode">{trigger}</ToolTip>;
  }

  return (
    <DropDown
      ref={dropdownRef}
      placement={DropdownPlacement.BOTTOM_START}
      disableCheveronIcon
      className={fullWidth ? "w-full" : undefined}
      sync={fullWidth ? "width" : undefined}
      triggerComponent={trigger}
    >
      <div
        className={cn(
          "rounded-lg bg-white p-1",
          fullWidth ? "w-full" : "w-[155px]",
        )}
      >
        {Object.entries(MODES).map(([key, { label, Icon }]) => {
          const isSelected = key === mode;
          return (
            <button
              key={key}
              type="button"
              onClick={() => {
                setMappingMode(key as MappingModeType);
                onDropdownHide();
                if (key === "basic" && isOtherProfilePage) {
                  navigate(APPLICATION_ROUTES.PROFILE_BASE);
                }
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
