import { BuildingIcon } from "@/components/ui/icons/buildings-icon";
import { ParkingIcon } from "@/components/ui/icons/parking-icon";
import { RoadsIcon } from "@/components/ui/icons/roads-icon";
import { SolarPanelIcon } from "@/components/ui/icons/solar-panel-icon";
import { SwimmingPoolIcon } from "@/components/ui/icons/swimming-pool-icon";
import { TreesIcon } from "@/components/ui/icons/trees-icon";
import { flagEmoji } from "@/features/try-fair/utils/common";
import { IconProps } from "@/types";

const FEATURE_ICONS: Record<string, React.FC<IconProps>> = {
  building: BuildingIcon,
  buildings: BuildingIcon,
  tree: TreesIcon,
  trees: TreesIcon,
  swimming_pool: SwimmingPoolIcon,
  "swimming-pool": SwimmingPoolIcon,
  parking: ParkingIcon,
  roads: RoadsIcon,
  "solar-panels": SolarPanelIcon,
  solar_panels: SolarPanelIcon,
};

export const getFeatureIcon = (slug: string): React.FC<IconProps> =>
  FEATURE_ICONS[slug] ?? BuildingIcon;

/** Radio indicator dot. */
export const RadioDot = ({ selected }: { selected: boolean }) => (
  <span
    className={`mt-0.5 shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
      selected ? "border-primary" : "border-gray-border"
    }`}
  >
    {selected && <span className="w-2 h-2 rounded-full bg-primary" />}
  </span>
);

export const FeatureBadge = ({ label }: { label: string | undefined }) => {
  const Icon = FEATURE_ICONS[label ?? ""] ?? BuildingIcon;
  const featureLabel = (label ?? "").replace(/[-_]/g, " ");
  return (
    <span className="inline-flex gap-2 items-center px-2 py-0.5 capitalize rounded bg-grey text-white text-xs font-medium">
      <Icon />
      {featureLabel}
    </span>
  );
};

/** Country flag chip. */
export const CountryBadge = ({
  country,
  code,
  showBg = true,
}: {
  country: string;
  code: string;
  showBg?: boolean;
}) => (
  <span
    className={
      showBg
        ? "inline-flex gap-1.5 truncate items-center px-2 py-0.5 rounded bg-grey text-white text-xs font-medium"
        : "inline-flex gap-1.5 truncate items-center px-2 py-0.5 rounded  text-grey text-xs font-medium"
    }
  >
    <span aria-hidden>{flagEmoji(code)}</span>
    {country}
  </span>
);
