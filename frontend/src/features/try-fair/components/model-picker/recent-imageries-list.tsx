import { RecentImageryEntry } from "@/features/try-fair/hooks/use-recent-imageries";
import { CountryBadge } from "@/features/try-fair/components/model-picker/model-picker-badges";
import { ChevronDownIcon } from "@/components/ui/icons";
import { cn } from "@/utils";
import { PictureIcon } from "@/components/ui/icons/picture-icon";
import { FeatureCheckIcon } from "@/components/ui/icons/feature-check-icon";
import { useImageryCountry } from "@/features/try-fair/hooks/use-imagery-country";



// ── Component ─────────────────────────────────────────────────────────────────

type RecentImageriesListProps = {
  recentImageries: RecentImageryEntry[];
  /** The tile URL of the currently active imagery, used to highlight it. */
  currentTileUrl: string | null;
  onSelectRecent: (entry: RecentImageryEntry) => void;
  onBack: () => void;
};

/**
 * A list panel of recently selected imageries. Matches the UI design with
 * thumbnail, name, source, and country badge. The currently active imagery
 * gets a red check indicator.
 */
const RecentItemRow = ({
  entry,
  isActive,
  onSelectRecent,
}: {
  entry: RecentImageryEntry;
  isActive: boolean;
  onSelectRecent: (entry: RecentImageryEntry) => void;
}) => {
  const fallbackCountry = useImageryCountry(entry.country ? null : entry.bounds);
  const countryName = entry.country || fallbackCountry?.country;
  const countryCode = entry.countryCode || fallbackCountry?.countryCode;

  return (
    <button
      type="button"
      onClick={() => onSelectRecent(entry)}
      className={cn(
        "w-full text-left bg-frosted-blue flex items-center gap-3 p-3 rounded-lg transition-colors",
        isActive
          ? "border-2 border-primary "
          : "",
      )}
    >
      {/* Thumbnail */}
      <div className="shrink-0 w-16 h-16 p-2 rounded-md overflow-hidden bg-white">
        {entry.thumbnailUrl ? (
          <img
            src={entry.thumbnailUrl}
            alt={entry.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-grey">
            <PictureIcon className="size-5" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-dark text-xs font-semibold leading-tight truncate">
          {entry.title}
        </p>
        <p className="text-grey text-[10px] leading-tight mt-0.5">
          Source: {entry.sourceLabel}
        </p>
        {countryName && (
          <div className="mt-1">
            <CountryBadge showBg={false} country={countryName} code={countryCode ?? ""} />
          </div>
        )}
      </div>

      {/* Selected indicator */}
      {isActive && <FeatureCheckIcon />}
    </button>
  );
};

export const RecentImageriesList = ({
  recentImageries,
  currentTileUrl,
  onSelectRecent,
  onBack,
}: RecentImageriesListProps) => {
  // Show most recent first.
  const sortedEntries = [...recentImageries].reverse();

  return (
    <div className="flex flex-col h-full">
      {/* Header with back button */}
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1   pb-2 text-xs font-semibold text-dark hover:text-primary transition-colors"
      >
        <ChevronDownIcon className="size-3 rotate-90" />
        Recent Imageries
      </button>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-3 rounded-lg border border-gray-border space-y-2">
        {sortedEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <p className="text-grey text-xs">No recent imageries yet.</p>
            <p className="text-grey text-[10px] mt-1">
              Selected imageries will appear here.
            </p>
          </div>
        ) : (
          sortedEntries.map((entry) => (
            <RecentItemRow
              key={entry.id}
              entry={entry}
              isActive={entry.tileUrl === currentTileUrl}
              onSelectRecent={onSelectRecent}
            />
          ))
        )}
      </div>
    </div>
  );
};
