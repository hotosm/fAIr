import { Button } from "@/components/ui/button";
import { Link } from "@/components/ui/link";
import { APPLICATION_ROUTES } from "@/constants/routes";
import { SHARED_CONTENT } from "@/constants";
import { useGetUserStates } from "@/features/user-profile/api/user-state";
import { RecentMappingCard } from "./recent-mapping-card";
import { MapComponent } from "@/components/map/map";
import { useMapInstance } from "@/hooks/use-map-instance";
import { useEffect } from "react";

const EmptyHeroMap = () => {
  const { mapContainerRef, map } = useMapInstance();

  useEffect(() => {
    if (!map) return;
    map.setCenter([20, 10]);
    map.setZoom(0.8);
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
      basemaps={false}
    />
  );
};

const RecentMappingSkeleton = () => (
  <section
    role="status"
    aria-label="Loading recent mapping"
    className="contour-bg grid min-h-[410px] min-w-0 grid-cols-1 gap-4 overflow-hidden rounded-xl bg-dark p-4 font-archivo text-white sm:grid-cols-[minmax(180px,0.72fr)_minmax(0,1.5fr)]"
  >
    <div className="flex min-w-0 flex-col p-1">
      <p className="text-sm font-semibold">Recent Mapping</p>

      <div className="mt-12 space-y-3" aria-hidden="true">
        <div className="h-5 w-4/5 rounded bg-white/15" />
        <div className="h-6 w-24 rounded bg-white/15" />
        <div className="h-3 w-28 rounded bg-white/10" />
      </div>

      <div className="mt-auto space-y-3 pt-8" aria-hidden="true">
        <div className="h-10 w-full rounded-lg bg-white/15" />
        <div className="h-10 w-full rounded-lg bg-white/10" />
      </div>
    </div>

    <div
      className="min-h-[260px] rounded-xl bg-white/10 sm:min-h-0"
      aria-hidden="true"
    />
    <span className="sr-only">Loading your latest mapping activity…</span>
  </section>
);

export const OverviewHero = () => {
  const { data, isPending } = useGetUserStates();
  const latestActivity = data?.results[0];

  if (isPending) {
    return <RecentMappingSkeleton />;
  }

  if (latestActivity) {
    return <RecentMappingCard activity={latestActivity} />;
  }

  return (
    <section className="grid min-w-0 grid-cols-1 sm:grid-cols-2 contour-bg gap-4 font-archivo rounded-md bg-dark p-4 text-white">
      <div className="flex min-w-0 flex-col gap-y-6 p-2 sm:p-4">
        <h1 className="font-semibold text-2xl">
          {SHARED_CONTENT.homepage.jumbotronTitle}
        </h1>
        <p className="text-off-white text-sm">
          {SHARED_CONTENT.homepage.jumbotronHeadline}
        </p>
        <Link
          href={APPLICATION_ROUTES.TRY_FAIR}
          nativeAnchor={false}
          title=""
          className="w-fit"
        >
          <Button fontSize={"14px"} rounded capitalize={false}>
            Start Mapping
          </Button>
        </Link>
      </div>

      <div className="hidden min-h-64 min-w-0 rounded-md w-full overflow-hidden bg-white/5 sm:block">
        <EmptyHeroMap />
      </div>
    </section>
  );
};
