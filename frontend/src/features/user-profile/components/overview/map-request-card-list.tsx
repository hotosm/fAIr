import { MapIcon } from "@/components/ui/icons";
import { getFeatureIcon } from "@/features/try-fair/components/model-picker/model-picker-badges";
import type { TOfflinePrediction } from "@/types";
import { cn } from "@/utils";
import {
  getModelUsed,
  getPredictionName,
  isResultReady,
} from "@/features/user-profile/components/overview/map-request-fields";
import { MapRequestStatusBadge } from "@/features/user-profile/components/overview/map-request-status-badge";

const FeatureBadge = ({ category }: { category: string }) => {
  const Icon = getFeatureIcon(category, MapIcon);
  return (
    <span className="inline-flex items-center gap-1.5 rounded bg-grey px-2 py-1 text-[11px] capitalize leading-none text-white">
      <Icon className="size-3 shrink-0" aria-hidden="true" />
      {category.replace(/[-_]/g, " ")}
    </span>
  );
};

/** "10 mins ago" / "2 hrs ago" for requests still running; older: the date. */
/** "25 Dec 2024", as in the mobile design. */
const formatCardDate = (iso: string): string =>
  new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const timeAgo = (iso: string): string => {
  const minutes = Math.max(
    0,
    Math.floor((Date.now() - Date.parse(iso)) / 60000),
  );
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} ${minutes === 1 ? "min" : "mins"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? "hr" : "hrs"} ago`;
  return formatCardDate(iso);
};

/** Map requests as stacked cards, for screens too narrow for the table. */
export const MapRequestCardList = ({
  requests,
  onViewResult,
  tone = "white",
  className,
}: {
  requests: TOfflinePrediction[];
  onViewResult: (prediction: TOfflinePrediction) => void;
  /** Card colour: white on a grey section, grey on a white page. */
  tone?: "white" | "grey";
  className?: string;
}) => (
  <ul className={cn("flex flex-col gap-3", className)}>
    {requests.map((request) => {
      const name = getPredictionName(request);
      const resultReady = isResultReady(request);
      return (
        <li
          key={request.id}
          className={cn(
            "flex flex-col gap-3 rounded-lg p-3",
            tone === "grey" ? "bg-gray-white" : "bg-white",
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <h3
              className="min-w-0 truncate text-base font-medium text-dark"
              title={name}
            >
              {name}
            </h3>
            <button
              type="button"
              disabled={!resultReady}
              onClick={() => onViewResult(request)}
              className="shrink-0 rounded-md bg-grey px-3 py-1.5 text-[11px] text-white disabled:cursor-not-allowed disabled:bg-[#EDEEF0] disabled:text-[#C4C7CC]"
            >
              View result
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {request.category && <FeatureBadge category={request.category} />}
            <MapRequestStatusBadge status={request.status} size="small" />
          </div>

          <div className="flex items-center justify-between gap-3 text-sm text-dark">
            <p className="min-w-0 truncate">
              <span className="text-grey">Model: </span>
              {getModelUsed(request)}
            </p>
            <p className="shrink-0">
              {/* Running requests: how long ago; finished ones: the date. */}
              {!request.submitted_at
                ? "-"
                : resultReady
                  ? formatCardDate(request.submitted_at)
                  : timeAgo(request.submitted_at)}
            </p>
          </div>
        </li>
      );
    })}
  </ul>
);
