import { Button } from "@/components/ui/button";
import { MapIcon } from "@/components/ui/icons";
import { Link } from "@/components/ui/link";
import { APPLICATION_ROUTES } from "@/constants/routes";
import { ButtonVariant } from "@/enums";
import type { SavedUserState } from "@/features/try-fair/api/user-state";
import { getFeatureIcon } from "@/features/try-fair/components/model-picker/model-picker-badges";
import { MapComponent } from "@/components/map/map";
import { useMapInstance } from "@/hooks/use-map-instance";
import { useEffect } from "react";

const getProjectPath = (pid: number) =>
  APPLICATION_ROUTES.TRY_FAIR_PROJECT.replace(":pid", String(pid));

const formatEditedTime = (timestamp: string) => {
  const editedAt = new Date(timestamp).getTime();
  if (Number.isNaN(editedAt)) return "Recently edited";

  const elapsedMinutes = Math.max(
    0,
    Math.floor((Date.now() - editedAt) / 60_000),
  );

  if (elapsedMinutes < 1) return "Edited just now";
  if (elapsedMinutes < 60) {
    return `Edited ${elapsedMinutes} minute${elapsedMinutes === 1 ? "" : "s"} ago`;
  }

  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) {
    return `Edited ${elapsedHours} hour${elapsedHours === 1 ? "" : "s"} ago`;
  }

  const elapsedDays = Math.floor(elapsedHours / 24);
  return `Edited ${elapsedDays} day${elapsedDays === 1 ? "" : "s"} ago`;
};

const RecentMappingMap = ({ activity }: { activity: SavedUserState }) => {
  const { mapContainerRef, map } = useMapInstance(
    false,
    false,
    "default",
    undefined,
    activity.state.bbox,
  );

  useEffect(() => {
    if (!map) return;
    map.dragPan.disable();
    map.scrollZoom.disable();
    map.doubleClickZoom.disable();
    map.touchZoomRotate.disable();
    map.keyboard.disable();
    map.boxZoom.disable();
    map.dragRotate.disable();
  }, [map]);

  return (
    <MapComponent
      map={map}
      mapContainerRef={mapContainerRef}
      zoomControls={false}
      tileServiceURL={activity.state.imagery.url}
      hasTileServiceLayer
    />
  );
};

export const RecentMappingCard = ({
  activity,
}: {
  activity: SavedUserState;
}) => {
  const { state } = activity;
  const label = state.category || state.type;
  const Icon =
    label === "mapping" || label === "prediction"
      ? MapIcon
      : getFeatureIcon(label, MapIcon);

  return (
    <section className="contour-bg grid min-h-[410px] min-w-0 grid-cols-1 gap-4 overflow-hidden rounded-xl bg-dark p-4 font-archivo text-white sm:grid-cols-[minmax(180px,0.72fr)_minmax(0,1.5fr)]">
      <div className="flex min-w-0 flex-col p-1 sm:p-1">
        <p className="text-sm font-semibold">Recent Mapping</p>

        <div className="mt-12 flex flex-col gap-y-3">
          <h3 className="truncate text-base font-semibold" title={state.name}>
            {state.name}
          </h3>
          <span className="inline-flex w-fit items-center gap-1.5 rounded bg-grey px-2 py-1 text-xs capitalize leading-4 text-white">
            <Icon className="size-3 shrink-0" aria-hidden="true" />
            {label.replace(/[-_]/g, " ")}
          </span>
          <p className="text-xs text-white/70">
            {formatEditedTime(activity.timestamp)}
          </p>
        </div>

        <div className="mt-auto flex flex-col gap-3 pt-8">
          <Link
            href={getProjectPath(activity.pid)}
            nativeAnchor={false}
            title="Resume Mapping"
            className="w-full"
          >
            <Button
              rounded
              capitalize={false}
              size="medium"
              fontSize="12px"
              className="w-full
              "
            >
              Resume Mapping
            </Button>
          </Link>
          <Link
            href={APPLICATION_ROUTES.TRY_FAIR}
            nativeAnchor={false}
            title="Start New Mapping"
            className="w-full"
          >
            <Button
              variant={ButtonVariant.SECONDARY}
              rounded
              capitalize={false}
              size="medium"
              fontSize="12px"
              className="w-full"
            >
              Start New Mapping
            </Button>
          </Link>
        </div>
      </div>

      <div
        className="min-h-[260px] min-w-0 overflow-hidden rounded-xl bg-white/5 sm:min-h-0"
        aria-label={`Map showing imagery for ${state.name}`}
      >
        <RecentMappingMap activity={activity} />
      </div>
    </section>
  );
};
