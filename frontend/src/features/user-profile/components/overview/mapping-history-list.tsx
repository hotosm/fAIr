import { Link } from "react-router-dom";
import { ChevronDownIcon, MapIcon } from "@/components/ui/icons";
import { APPLICATION_ROUTES } from "@/constants/routes";
import type { SavedUserState } from "@/features/try-fair/api/user-state";
import { getFeatureIcon } from "@/features/try-fair/components/model-picker/model-picker-badges";
import { cn } from "@/utils";

export const getProjectPath = ({ pid }: SavedUserState) =>
  APPLICATION_ROUTES.TRY_FAIR_PROJECT.replace(":pid", String(pid));

/** The feature (or "mapping") a saved project was made for. */
export const MappingTypeBadge = ({
  activity,
  className,
}: {
  activity: SavedUserState;
  className?: string;
}) => {
  const { type, category } = activity.state;
  const label = category || type;
  const Icon =
    label === "mapping" || label === "prediction"
      ? MapIcon
      : getFeatureIcon(label, MapIcon);
  const text = label.replace(/[-_]/g, " ");
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 rounded bg-grey px-2 py-0.5 capitalize leading-4 text-white",
        className,
      )}
      title={text}
    >
      <Icon className="size-3 shrink-0" aria-hidden="true" />
      <span className="truncate">{text}</span>
    </span>
  );
};

/**
 * Mapping history as simple rows (name, feature, ›) for phones, where the
 * table doesn't fit. Each row opens the saved mapping project.
 */
export const MappingHistoryList = ({
  activities,
  className,
}: {
  activities: SavedUserState[];
  className?: string;
}) => (
  <ul className={cn("flex flex-col", className)}>
    {activities.map((activity) => (
      <li key={activity.pid}>
        <Link
          to={getProjectPath(activity)}
          className="flex items-center gap-3 rounded-lg px-4 py-3.5 text-sm text-dark hover:bg-light-gray"
        >
          <span className="min-w-0 flex-1 truncate" title={activity.state.name}>
            {activity.state.name}
          </span>
          <MappingTypeBadge
            activity={activity}
            className="w-[84px] shrink-0 py-1 text-[11px] leading-none"
          />
          <ChevronDownIcon
            className="size-3 shrink-0 -rotate-90"
            aria-hidden="true"
          />
        </Link>
      </li>
    ))}
  </ul>
);
